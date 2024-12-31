/**
 * External
 */
export type {
  Rollup,
  Alias as ViteAlias,
  ConfigEnv as ViteConfigEnv,
  PluginOption as VitePluginOption,
  UserConfig as ViteUserConfig,
} from 'vite';

/**
 * System
 */
export type * from '@sys/std/t';

export type { DenofileJson, DenofilePath, DenoWorkspace } from '@sys/driver-deno/t';
export type { ProcOutput, ProcHandle, ProcReadySignalFilter } from '@sys/proc/t';
export type { CssValue } from '@sys/ui-css/t';

/**
 * Local
 */
export type * from '../types.ts';
