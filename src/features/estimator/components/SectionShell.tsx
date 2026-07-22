'use client';

import type { ReactNode } from 'react';

type SectionShellProps = {
  title: string;
  eyebrow?: string;
  children: ReactNode;
  actions?: ReactNode;
};

export function SectionShell({ title, eyebrow, children, actions }: SectionShellProps) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          {eyebrow && <div className="text-[10px] uppercase font-black tracking-widest text-[#004ccd]">{eyebrow}</div>}
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">{title}</h3>
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}
