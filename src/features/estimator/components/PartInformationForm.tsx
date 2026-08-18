'use client';

import type { ReactNode } from 'react';
import { SectionShell } from './SectionShell';

// Renders the part information form UI section.
export function PartInformationForm({ children }: { children: ReactNode }) {
  return <SectionShell title="Part Information" eyebrow="Extracted Parameters">{children}</SectionShell>;
}
