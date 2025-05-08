import { type t } from './common.ts';

export const download: t.MediaLib['download'] = (blob?, filename = 'recording') => {
  if (!blob) return;
  filename = filename.trim().replace(/\.webm$/, '');
  filename = `${filename}.webm`;

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};
