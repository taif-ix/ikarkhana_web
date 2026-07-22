'use client';

import type { ReactNode } from 'react';
import type { CalculationStep, EstimateLineItem } from '../../../types/costing';

type NestingVisualModalProps = {
  item: EstimateLineItem | null;
  onClose: () => void;
  renderNestingVisual: (item: EstimateLineItem) => ReactNode;
  formatInr: (value: number) => string;
  onOpenBreakdown: (title: string, steps: CalculationStep[]) => void;
  nestingValueBreakdownSteps: (item: EstimateLineItem, valueType: 'weight' | 'scrapWeight' | 'scrapValue') => CalculationStep[];
};

export function NestingVisualModal({
  item,
  onClose,
  renderNestingVisual,
  formatInr,
  onOpenBreakdown,
  nestingValueBreakdownSteps,
}: NestingVisualModalProps) {
  if (!item) return null;

  return (
    <div className="fixed inset-0 z-[126] bg-slate-950/60 flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-4xl bg-white border border-[#c3c6d8] rounded-xl shadow-2xl overflow-hidden" onClick={(event) => event.stopPropagation()}>
        <div className="px-5 py-4 bg-slate-950 text-white flex items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-widest font-bold text-cyan-200">Nesting / Stock Cutting Visual</div>
            <h3 className="text-base font-black truncate">{item.name}</h3>
          </div>
          <button type="button" className="px-3 py-1.5 rounded bg-white/10 text-white text-xs font-bold hover:bg-white/15" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="p-5 space-y-5">
          {renderNestingVisual(item)}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="text-[10px] uppercase font-black tracking-widest text-slate-500 mb-2">Calculation approach</div>
            <div className="text-sm leading-relaxed text-slate-700">{item.nestingApproach}</div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-white border border-slate-200 rounded">
              <div className="text-[10px] uppercase font-black text-slate-500">Part qty</div>
              <div className="font-mono font-black">{item.quantity} pcs</div>
            </div>
            <button type="button" className="p-3 bg-white border border-slate-200 hover:border-[#004ccd] hover:bg-blue-50/40 rounded text-left transition-colors" onClick={() => onOpenBreakdown(`${item.name} Part Weight`, nestingValueBreakdownSteps(item, 'weight'))}>
              <div className="text-[10px] uppercase font-black text-slate-500">Part weight</div>
              <div className="font-mono font-black text-[#004ccd] underline decoration-dotted underline-offset-4">{Number(item.weightKg || 0).toFixed(3)} kg</div>
              <div className="mt-1 text-[9px] uppercase font-black text-[#004ccd]">View simple breakdown</div>
            </button>
            <button type="button" className="p-3 bg-white border border-slate-200 hover:border-[#004ccd] hover:bg-blue-50/40 rounded text-left transition-colors" onClick={() => onOpenBreakdown(`${item.name} Scrap Weight`, nestingValueBreakdownSteps(item, 'scrapWeight'))}>
              <div className="text-[10px] uppercase font-black text-slate-500">Scrap weight</div>
              <div className="font-mono font-black text-[#004ccd] underline decoration-dotted underline-offset-4">{Number(item.scrapWeightKg || 0).toFixed(3)} kg</div>
              <div className="mt-1 text-[9px] uppercase font-black text-[#004ccd]">View simple breakdown</div>
            </button>
            <button type="button" className="p-3 bg-white border border-slate-200 hover:border-[#004ccd] hover:bg-blue-50/40 rounded text-left transition-colors" onClick={() => onOpenBreakdown(`${item.name} Scrap Value`, nestingValueBreakdownSteps(item, 'scrapValue'))}>
              <div className="text-[10px] uppercase font-black text-slate-500">Scrap value</div>
              <div className="font-mono font-black text-[#004ccd] underline decoration-dotted underline-offset-4">{formatInr(item.scrapValue || 0)}</div>
              <div className="mt-1 text-[9px] uppercase font-black text-[#004ccd]">View simple breakdown</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
