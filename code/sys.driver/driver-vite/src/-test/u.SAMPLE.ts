import { Testing } from './common.ts';

export const SAMPLE = {
  fs: Testing.dir,
  Dirs: {
    a: './src/-test/vite.sample-a',
    b: './src/-test/vite.sample-b',
  },
} as const;
