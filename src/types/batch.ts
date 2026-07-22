import type { EstimationResult, StructuredBreakdown, TechnicalParams } from './costing';

export interface BatchUploadFile {
  name: string;
  sizeMb: string;
  image: string;
  isChild: boolean;
}

export interface BatchProcessingResult {
  status: 'queued' | 'processing' | 'processed' | 'error';
  params?: TechnicalParams;
  estimation?: EstimationResult;
  structuredBreakdown?: StructuredBreakdown;
  childFiles?: BatchUploadFile[];
  error?: string;
}

export interface BackendBatchFileResult {
  file_name: string;
  size_mb: string;
  preview_image: string;
  status: 'queued' | 'processing' | 'processed' | 'error';
  error?: string | null;
  child_files?: Array<{ file_name: string; size_mb: string; preview_image: string }>;
  child_hints?: string[];
  missing_child_hints?: string[];
  structured_breakdown?: StructuredBreakdown;
}
