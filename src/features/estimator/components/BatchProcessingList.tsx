'use client';

import type { ReactNode } from 'react';
import { SectionShell } from './SectionShell';

// Renders the batch processing list UI section.
export function BatchProcessingList({ children }: { children: ReactNode }) {
  return <SectionShell title="Batch Processing List" eyebrow="Async File Status">{children}</SectionShell>;
}
