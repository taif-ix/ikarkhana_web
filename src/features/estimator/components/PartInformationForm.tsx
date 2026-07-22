'use client';

import type { ReactNode } from 'react';
import { SectionShell } from './SectionShell';

export function PartInformationForm({ children }: { children: ReactNode }) {
  return <SectionShell title="Part Information" eyebrow="Extracted Parameters">{children}</SectionShell>;
}
