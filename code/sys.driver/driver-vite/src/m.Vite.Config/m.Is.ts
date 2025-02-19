import { type t, isRecord } from './common.ts';

export const Is: t.ViteConfigIsLib = {
  paths(input: any): input is t.ViteConfigPaths {
    if (!isRecord(input)) return false;
    const o = input as t.ViteConfigPaths;
    return (
      typeof o.cwd === 'string' &&
      typeof o.app?.entry === 'string' &&
      typeof o.app?.outDir === 'string'
    );
  },
};
