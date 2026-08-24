'use client';

import { useState } from 'react';
import { Check, Clipboard, Download, FileJson, X } from 'lucide-react';

export type AiJsonEntry = {
  id: string;
  label: string;
  endpoint: string;
  description: string;
  fileName?: string;
  payload: unknown;
};

type Props = { entries: AiJsonEntry[]; open: boolean; onClose: () => void; onClear: () => void };

export function AiJsonViewer({ entries, open, onClose, onClear }: Props) {
  const [copiedId, setCopiedId] = useState('');
  if (!open) return null;

  const copyJson = async (entry: AiJsonEntry) => {
    await navigator.clipboard.writeText(JSON.stringify(entry.payload, null, 2));
    setCopiedId(entry.id);
    window.setTimeout(() => setCopiedId(''), 1500);
  };

  const downloadJson = (entry: AiJsonEntry) => {
    const json = JSON.stringify(entry.payload, null, 2);
    const blobUrl = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
    const anchor = document.createElement('a');
    anchor.href = blobUrl;
    anchor.download = `${entry.label}-${entry.fileName || 'response'}`.replace(/[^a-z0-9._-]+/gi, '-').toLowerCase() + '.json';
    anchor.click();
    URL.revokeObjectURL(blobUrl);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm" onMouseDown={onClose}>
      <section className="flex h-[86vh] w-full max-w-6xl flex-col overflow-hidden rounded-xl border border-slate-700 bg-slate-950 shadow-2xl" onMouseDown={event => event.stopPropagation()}>
        <header className="flex items-center justify-between border-b border-slate-800 bg-slate-900 px-5 py-4">
          <div>
            <div className="flex items-center gap-2 text-sm font-black text-white"><FileJson className="h-4 w-4 text-cyan-400" /> Raw AI JSON responses</div>
            <div className="mt-1 text-[11px] text-slate-400">Each response is separated and identified by its endpoint and purpose.</div>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-blue-600 px-2.5 py-1 text-[10px] font-black text-white">{entries.length} captured</span>
            <button type="button" onClick={onClose} className="rounded p-2 text-slate-400 hover:bg-slate-800 hover:text-white" aria-label="Close AI JSON viewer"><X className="h-5 w-5" /></button>
          </div>
        </header>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
          {entries.length === 0 && <div className="flex h-full items-center justify-center text-sm text-slate-500">Run an AI extraction to capture its JSON responses.</div>}
          {entries.map((entry, index) => (
            <details key={entry.id} open={index === entries.length - 1} className="overflow-hidden rounded-xl border border-slate-700 bg-slate-900">
              <summary className="cursor-pointer list-none p-4 hover:bg-slate-800/70">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-xs font-black uppercase tracking-wider text-white">{index + 1}. {entry.label}</div>
                    <code className="mt-1 inline-block rounded bg-cyan-950 px-2 py-1 text-[10px] font-bold text-cyan-300">POST {entry.endpoint}</code>
                    {entry.fileName && <div className="mt-2 truncate font-mono text-[10px] text-slate-400">File: {entry.fileName}</div>}
                  </div>
                  <span className="shrink-0 text-[10px] font-bold uppercase text-slate-500">Expand JSON</span>
                </div>
                <p className="mt-3 max-w-4xl text-xs leading-relaxed text-slate-400">{entry.description}</p>
              </summary>
              <div className="border-t border-slate-700">
                <div className="flex justify-end gap-2 bg-slate-900 px-3 py-2">
                  <button type="button" onClick={() => void copyJson(entry)} className="flex items-center gap-1 rounded border border-slate-700 px-3 py-1.5 text-[10px] font-bold text-slate-200 hover:bg-slate-800">
                    {copiedId === entry.id ? <Check className="h-3.5 w-3.5" /> : <Clipboard className="h-3.5 w-3.5" />} {copiedId === entry.id ? 'Copied' : 'Copy JSON'}
                  </button>
                  <button type="button" onClick={() => downloadJson(entry)} className="flex items-center gap-1 rounded border border-slate-700 px-3 py-1.5 text-[10px] font-bold text-slate-200 hover:bg-slate-800"><Download className="h-3.5 w-3.5" /> Download</button>
                </div>
                <pre className="max-h-[55vh] overflow-auto bg-slate-950 p-5 font-mono text-xs leading-relaxed text-emerald-300">{JSON.stringify(entry.payload, null, 2)}</pre>
              </div>
            </details>
          ))}
        </div>

        <footer className="flex justify-end border-t border-slate-800 bg-slate-900 px-4 py-2">
          <button type="button" onClick={onClear} disabled={entries.length === 0} className="text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-red-400 disabled:opacity-40">Clear captured responses</button>
        </footer>
      </section>
    </div>
  );
}
