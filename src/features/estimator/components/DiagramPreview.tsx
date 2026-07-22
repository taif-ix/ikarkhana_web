'use client';

import type { ReactNode } from 'react';
import { SectionShell } from './SectionShell';

export function DiagramPreview({ children }: { children: ReactNode }) {
  return <SectionShell title="Diagram Preview" eyebrow="Source Drawing">{children}</SectionShell>;
}
