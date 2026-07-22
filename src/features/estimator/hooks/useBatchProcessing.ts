'use client';

import { useState, type Dispatch, type MouseEvent, type SetStateAction } from 'react';
import type { BackendBatchFileResult, BatchProcessingResult, BatchUploadFile } from '../../../types/batch';

type UseBatchProcessingArgs = {
  setBatchProcessingResults: Dispatch<SetStateAction<Record<string, BatchProcessingResult>>>;
  applyBackendBatchJob: (job: any) => void;
  childFilesForParentFromMap: (
    parent: BatchUploadFile,
    files: BatchUploadFile[],
    hintsMap: Record<string, string[]>,
  ) => BatchUploadFile[];
  processSingleBatchFile: (
    file: BatchUploadFile,
    files: BatchUploadFile[],
    hintsMap: Record<string, string[]>,
  ) => Promise<void>;
  batchUploadFiles: BatchUploadFile[];
  batchDependencyHints: Record<string, string[]>;
};

const wait = (ms: number) => new Promise(resolve => window.setTimeout(resolve, ms));

export function useBatchProcessing({
  setBatchProcessingResults,
  applyBackendBatchJob,
  childFilesForParentFromMap,
  processSingleBatchFile,
  batchUploadFiles,
  batchDependencyHints,
}: UseBatchProcessingArgs) {
  const [batchJobId, setBatchJobId] = useState('');

  const runBatchExtractionForMainFiles = async (files: BatchUploadFile[], hintsMap: Record<string, string[]>) => {
    const filesToProcess = files;
    setBatchProcessingResults(Object.fromEntries(filesToProcess.map(file => [
      file.name,
      { status: 'queued' as const, childFiles: childFilesForParentFromMap(file, files, hintsMap) },
    ])));

    try {
      const response = await fetch('/api/batch-process/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files: filesToProcess, dependencyHints: hintsMap }),
      });
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Backend batch processing failed to start');
      }

      setBatchJobId(result.data.job_id);
      applyBackendBatchJob(result.data);

      let isDone = false;
      while (!isDone) {
        await wait(900);
        const statusResponse = await fetch(`/api/batch-process/status?jobId=${encodeURIComponent(result.data.job_id)}`, {
          cache: 'no-store',
        });
        const statusResult = await statusResponse.json();
        if (!statusResult.success) {
          throw new Error(statusResult.error || 'Could not read backend batch status');
        }
        applyBackendBatchJob(statusResult.data);
        const statuses = (statusResult.data.files || []).map((file: BackendBatchFileResult) => file.status);
        isDone = statuses.length > 0 && statuses.every((status: string) => status === 'processed' || status === 'error');
      }
    } catch (error: any) {
      setBatchProcessingResults(prev => Object.fromEntries(filesToProcess.map(file => [
        file.name,
        {
          ...(prev[file.name] || {}),
          status: 'error' as const,
          childFiles: childFilesForParentFromMap(file, files, hintsMap),
          error: error?.message || 'Backend batch processing failed',
        },
      ])));
    }
  };

  const retryBatchFile = async (file: BatchUploadFile, event?: MouseEvent) => {
    event?.stopPropagation();
    setBatchProcessingResults(prev => ({
      ...prev,
      [file.name]: { ...(prev[file.name] || {}), status: 'queued', error: undefined },
    }));

    if (!batchJobId) {
      await processSingleBatchFile(file, batchUploadFiles, batchDependencyHints);
      return;
    }

    try {
      const response = await fetch('/api/batch-process/retry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: batchJobId, fileName: file.name }),
      });
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Retry failed');
      }
      applyBackendBatchJob(result.data);

      let isDone = false;
      while (!isDone) {
        await wait(900);
        const statusResponse = await fetch(`/api/batch-process/status?jobId=${encodeURIComponent(batchJobId)}`, {
          cache: 'no-store',
        });
        const statusResult = await statusResponse.json();
        if (!statusResult.success) {
          throw new Error(statusResult.error || 'Could not read retry status');
        }
        applyBackendBatchJob(statusResult.data);
        const retried = (statusResult.data.files || []).find((item: BackendBatchFileResult) => item.file_name === file.name);
        isDone = retried && (retried.status === 'processed' || retried.status === 'error');
      }
    } catch (error: any) {
      setBatchProcessingResults(prev => ({
        ...prev,
        [file.name]: { ...(prev[file.name] || {}), status: 'error', error: error?.message || 'Retry failed' },
      }));
    }
  };

  return {
    batchJobId,
    runBatchExtractionForMainFiles,
    retryBatchFile,
  };
}
