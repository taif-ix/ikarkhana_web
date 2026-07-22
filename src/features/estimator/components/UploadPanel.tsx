'use client';

import type { ReactNode } from 'react';
import { SectionShell } from './SectionShell';

export function UploadPanel({ children }: { children: ReactNode }) {
  return <SectionShell title="Upload Panel" eyebrow="File Intake">{children}</SectionShell>;
}
