import { type t, isRecord } from './common.ts';

export const Is: t.ViteConfig.Is.Lib = {
  paths(input: unknown): input is t.ViteConfig.Paths {
    if (!isRecord(input)) return false;
    const o = input as t.ViteConfig.Paths;
    return (
      typeof o.cwd === 'string' &&
      typeof o.app?.entry === 'string' &&
      typeof o.app?.outDir === 'string'
    );
  },
};
