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
export type {
  CommonTheme,
  CompositeHash,
  DistPkg,
  Msecs,
  Pkg,
  StringDir,
  StringHash,
  StringPath,
  StringUrl,
} from '@sys/std/t';

export type { DenoWorkspace, DenofileJson, DenofilePath } from '@sys/driver-deno/t';
export type { CmdOutput, CmdProcessHandle } from '@sys/std-s/t';
export type { CssValue } from '@sys/ui-dom/t';

/**
 * Local
 */
export type * from '../types.ts';
