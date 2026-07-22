'use client';

import type { ReactNode } from 'react';
import { SectionShell } from './SectionShell';

export function RatesPanel({ children }: { children: ReactNode }) {
  return <SectionShell title="Rates Used For Costing" eyebrow="Editable Inputs">{children}</SectionShell>;
}
