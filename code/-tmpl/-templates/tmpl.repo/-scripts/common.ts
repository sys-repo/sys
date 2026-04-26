export * from '../code/common/mod.ts';
export { Fs } from '@sys/fs';
export { Process } from '@sys/process';
export { Args } from '@sys/std/args';

export const PATHS = {
  packages: 'code/packages',
  build: '.github/workflows/build.yaml',
  test: '.github/workflows/test.yaml',
} as const;
