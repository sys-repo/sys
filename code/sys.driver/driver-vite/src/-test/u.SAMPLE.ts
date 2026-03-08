import { Testing } from './common.ts';

export const SAMPLE = {
  fs: Testing.dir,
  Dirs: {
    sample1: './src/-test/vite.sample-1',
    sample2: './src/-test/vite.sample-2',
    sample3: './src/-test/vite.sample-3',
    sampleStdPath: './src/-test/vite.sample-std-path',
    sampleBridge: './src/-test/vite.sample-bridge',
    sampleBridgePublished: './src/-test/vite.sample-bridge-published',
    sampleUiBaselinePublished: './src/-test/vite.sample-ui-baseline-published',
    sampleBridgePlain: './src/-test/vite.sample-bridge-plain',
  },
} as const;
