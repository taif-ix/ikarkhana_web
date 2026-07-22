'use client';

import type { ReactNode } from 'react';
import { SectionShell } from './SectionShell';

export function BatchProcessingList({ children }: { children: ReactNode }) {
  return <SectionShell title="Batch Processing List" eyebrow="Async File Status">{children}</SectionShell>;
}
