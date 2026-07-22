const SAMPLE_DEPENDENCY_FALLBACKS: Record<string, string[]> = {
  ls10255: ['LS10269.tif'],
  ls10257: ['LS10165.tif', 'LS10268.tif', 'LS10269.tif'],
  ls10258: ['LS10167.tif', 'LS10268.tif', 'MDG0008.tif'],
  ls10260: ['LS10266.tif', 'MDG0008.tif'],
  ls10262: ['LS10145.tif', 'LS10267.tif', 'LS10266.tif'],
  ls10263: ['LS10239.tif', 'LS10267.tif'],
  ls10270: ['LS10246.tif', 'MDG0008.tif'],
  ls10270_a: ['LS10246.tif', 'MDG0008.tif'],
};

export const dependencyFallbacksFor = (drawingBase: string) =>
  SAMPLE_DEPENDENCY_FALLBACKS[drawingBase] || [];
