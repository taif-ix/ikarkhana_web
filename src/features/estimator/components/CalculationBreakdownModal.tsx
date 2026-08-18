'use client';

import type { CalculationStep } from '../../../types/costing';

type SelectedBreakdown = {
  title: string;
  steps: CalculationStep[];
};

type CalculationBreakdownModalProps = {
  selectedBreakdown: SelectedBreakdown | null;
  onClose: () => void;
  cleanBreakdownText: (value: string) => string;
  simpleBreakdownMeaning: (step: CalculationStep) => string;
  onOpenStepSource: (title: string, step: CalculationStep) => void;
};

// Renders the calculation breakdown modal UI section.
export function CalculationBreakdownModal({
  selectedBreakdown,
  onClose,
  cleanBreakdownText,
}: CalculationBreakdownModalProps) {
  if (!selectedBreakdown) return null;

  return (
    <div className="fixed inset-0 z-[120] bg-slate-950/45 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="w-full max-w-2xl max-h-[82vh] bg-white border border-[#c3c6d8] rounded-xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="px-5 py-4 bg-slate-50 border-b border-[#c3c6d8] flex items-center justify-between gap-4">
          <div>
            <div className="text-[10px] uppercase tracking-widest font-bold text-[#004ccd]">Calculation Breakdown</div>
            <h3 className="text-base font-black text-slate-900">{selectedBreakdown.title}</h3>
          </div>
          <button type="button" className="px-3 py-1.5 rounded bg-slate-900 text-white text-xs font-bold hover:bg-slate-800" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="p-5 overflow-y-auto custom-scrollbar space-y-3">
          {selectedBreakdown.steps.map((step, idx) => (
            <div key={`${step.name}-${idx}`} className="p-4 bg-white rounded-lg border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[10px] uppercase font-bold text-[#004ccd] tracking-wider">{step.section}</div>
                  <div className="text-sm font-black text-slate-900">{step.name}</div>
                </div>
                <div className="px-2 py-1 rounded bg-emerald-50 text-emerald-800 text-xs font-mono font-black whitespace-nowrap">
                  {cleanBreakdownText(step.result)}
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="text-[10px] uppercase font-black text-slate-500 mb-1">Formula</div>
                  <div className="font-mono text-sm text-slate-900 leading-relaxed">{cleanBreakdownText(step.formula)}</div>
                </div>
                <div className="pt-3 border-t border-slate-100">
                  <div className="text-[10px] uppercase font-black text-slate-500 mb-1">Values used</div>
                  <div className="font-mono text-sm text-slate-900 leading-relaxed">{cleanBreakdownText(step.substitutedValues)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
