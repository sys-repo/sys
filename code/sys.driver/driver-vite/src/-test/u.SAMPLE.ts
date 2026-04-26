import { Testing } from './common.ts';
import { ROOT } from './u.ROOT.ts';

export const SAMPLE = {
  fs: Testing.dir,
  Dirs: {
    sample1: ROOT.resolve('code/sys.driver/driver-vite/src/-test/vite.sample-1'),
    sample2: ROOT.resolve('code/sys.driver/driver-vite/src/-test/vite.sample-2'),
    sample3: ROOT.resolve('code/sys.driver/driver-vite/src/-test/vite.sample-3'),
    sampleStdPath: ROOT.resolve('code/sys.driver/driver-vite/src/-test/vite.sample-std-path'),
    sampleBridge: ROOT.resolve('code/sys.driver/driver-vite/src/-test/vite.sample-bridge'),
    sampleBridgePlain: ROOT.resolve('code/sys.driver/driver-vite/src/-test/vite.sample-bridge-plain'),
    samplePublishedBaseline: ROOT.resolve('code/sys.driver/driver-vite/src/-test/vite.sample-published-baseline'),
    samplePublishedUiBaseline: ROOT.resolve('code/sys.driver/driver-vite/src/-test/vite.sample-published-ui-baseline'),
    samplePublishedUiComponents: ROOT.resolve('code/sys.driver/driver-vite/src/-test/vite.sample-published-ui-components'),
  },
} as const;
