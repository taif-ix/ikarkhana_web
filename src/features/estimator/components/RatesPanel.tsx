'use client';

import type { ReactNode } from 'react';
import { SectionShell } from './SectionShell';

// Renders the rates panel UI section.
export function RatesPanel({ children }: { children: ReactNode }) {
  return <SectionShell title="Rates Used For Costing" eyebrow="Editable Inputs">{children}</SectionShell>;
}
