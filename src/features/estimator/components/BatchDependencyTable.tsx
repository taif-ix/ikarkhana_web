'use client';

import type { ReactNode } from 'react';
import { SectionShell } from './SectionShell';

export function BatchDependencyTable({ children }: { children: ReactNode }) {
  return <SectionShell title="Batch Dependency Table" eyebrow="Parent / Child Drawings">{children}</SectionShell>;
}
