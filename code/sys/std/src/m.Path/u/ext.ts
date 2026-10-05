import { extname as base } from '@std/path';
import { Is, type t } from '../common.ts';

export const extname: t.Path.Lib['extname'] = (input) => {
  return Is.string(input) ? base(input) : '';
};

export const ext: t.Path.Lib['ext'] = (...exts) => {
  const suffixes = [
    ...new Set(
      exts
        .filter((s) => String(s).trim())
        .map((s) => s.replace(/^\.+/, ''))
        .map((s) => `.${s}`),
    ),
  ];

  const api: t.Path.FileExtension = {
    suffixes: Array.from(suffixes) as readonly string[],
    is(...path) {
      return path.every((path) => suffixes.some((ext) => path.endsWith(ext)));
    },
  };

  return api;
};
