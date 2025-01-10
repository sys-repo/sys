export * from '../common.ts';
export { Fs } from '../m.Fs/mod.ts';
export { Path } from '../m.Path/mod.ts';
export { DirHash } from '../m.Dir.Hash/mod.ts';

export const NAME = {
  dir: 'dir',
  meta: 'dir.json',
  prefix: 'snapshot',
  ext: { backref: '.backref' },
} as const;
export const DEFAULTS = { NAME } as const;
