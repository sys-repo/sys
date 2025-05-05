import { extname as base } from '@std/path';
import { type t } from './common.ts';

export const extname: t.PathLib['extname'] = (input) => {
  return typeof input === 'string' ? base(input) : '';
};

export const ext: t.PathLib['ext'] = (...exts) => {
  const suffixes = [
    ...new Set(
      exts
        .filter((s) => String(s).trim())
        .map((s) => s.replace(/^\.+/, ''))
        .map((s) => `.${s}`),
    ),
  ];

  const api: t.PathExtension = {
    suffixes: Array.from(suffixes) as readonly string[],
    is(...path) {
      return path.every((path) => suffixes.some((ext) => path.endsWith(ext)));
    },
  };

  return api;
};
