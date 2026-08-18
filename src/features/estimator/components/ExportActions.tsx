'use client';

type ExportActionsProps = {
  currentScreen: 'landing' | 'workspace';
  avatarUrl: string;
  onBackToFileList: () => void;
  onLoadSampleOrChangeFile: () => void;
  onExportReport: () => void;
  onExportFormula: () => void;
  showBackToFileList: boolean;
};

// Renders the export actions UI section.
export function ExportActions({
  currentScreen,
  avatarUrl,
  onBackToFileList,
  onLoadSampleOrChangeFile,
  onExportReport,
  onExportFormula,
  showBackToFileList,
}: ExportActionsProps) {
  return (
    <div className="flex items-center gap-3">
      {showBackToFileList && (
        <button
          className="px-4 py-2 bg-white hover:bg-blue-50 text-[#004ccd] transition-colors text-xs font-semibold border border-[#004ccd] rounded"
          onClick={onBackToFileList}
        >
          Back to File List
        </button>
      )}
      <button
        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors text-xs font-semibold border border-slate-300 rounded"
        onClick={onLoadSampleOrChangeFile}
      >
        {currentScreen === 'landing' ? 'Load Sample Blueprint' : 'Change File'}
      </button>
      <button
        className="px-4 py-2 bg-[#004ccd] hover:bg-[#0f62fe] text-white transition-colors text-xs font-semibold rounded"
        onClick={onExportReport}
      >
        Export Report
      </button>
      <button
        className="px-4 py-2 bg-white hover:bg-slate-100 text-[#004ccd] transition-colors text-xs font-semibold border border-[#004ccd] rounded"
        onClick={onExportFormula}
      >
        Export Formula
      </button>
      <div className="w-8 h-8 rounded-full border border-slate-300 overflow-hidden flex items-center justify-center bg-slate-100">
        <img className="w-full h-full object-cover" src={avatarUrl} alt="User profile" />
      </div>
    </div>
  );
}
