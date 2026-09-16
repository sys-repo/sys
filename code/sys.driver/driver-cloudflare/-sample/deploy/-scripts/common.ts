import { Fs } from '../src/common.ts';
export * from '../src/common.ts';

export const ROOT = Fs.Path.fromFileUrl(new URL('../', import.meta.url));
