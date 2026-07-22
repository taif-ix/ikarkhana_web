'use client';

import type { ReactNode } from 'react';
import { SectionShell } from './SectionShell';

export function PartCards({ children }: { children: ReactNode }) {
  return <SectionShell title="Part Wise Cards" eyebrow="Per Part Costing">{children}</SectionShell>;
}
