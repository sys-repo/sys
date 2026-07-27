/**
 * External
 */
export type {
  Alias as ViteAlias,
  BuildEnvironmentOptions as ViteBuildEnvironmentOptions,
  ConfigEnv as ViteConfigEnv,
  LibraryOptions as ViteLibraryOptions,
  Plugin as VitePlugin,
  PluginOption as VitePluginOption,
  Rollup,
  UserConfig as ViteUserConfig,
  UserConfigExport as ViteUserConfigExport,
} from 'vite';

/**
 * System
 */
export type * from '@sys/types';

export type { Cli } from '@sys/cli/t';
export type { DenoDeps, DenoFile } from '@sys/driver-deno/t';
export type { Process } from '@sys/process/t';
export type { Time } from '@sys/std/t';

/**
 * Local
 */
export type * from '../types.ts';
