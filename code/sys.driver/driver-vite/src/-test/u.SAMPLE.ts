import { Testing } from './common.ts';

export const SAMPLE = {
  fs: Testing.dir,
  Dirs: {
    sample1: './src/-test/vite.sample-1',
    sample2: './src/-test/vite.sample-2',
    sample3: './src/-test/vite.sample-3',
  },
} as const;
