export const safe = (value: unknown) => {
  if (value === null) {
    return '-';
  }

  if (value === undefined) {
    return '-';
  }

  if (value === '') {
    return '-';
  }

  return String(value);
};

export const numberSafe = (value: unknown) => {
  const numeric = Number(value);

  if (Number.isFinite(numeric)) {
    return numeric;
  }

  return 0;
};

export const xmlEscape = (value: unknown) => {
  const safeValue = safe(value);
  return safeValue
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
};

export const downloadTextFile = (content: string, filename: string, type = 'application/vnd.ms-excel;charset=utf-8;') => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};
