'use client';

import type { ReactNode } from 'react';
import { SectionShell } from './SectionShell';

// Renders the diagram preview UI section.
export function DiagramPreview({ children }: { children: ReactNode }) {
  return <SectionShell title="Diagram Preview" eyebrow="Source Drawing">{children}</SectionShell>;
}
