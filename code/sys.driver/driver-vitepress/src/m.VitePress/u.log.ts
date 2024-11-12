import { ViteLog } from '@sys/driver-vite/log';
import type { t } from './common.ts';

export const Log = {
  Build: {
    log: (args: t.ViteLogBundleArgs) => console.info(Log.Build.toString(args)),
    toString: (args: t.ViteLogBundleArgs) => ViteLog.Bundle.toString(args),
  },
} as const;
