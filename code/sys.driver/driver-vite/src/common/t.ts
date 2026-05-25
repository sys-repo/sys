/**
 * External
 */
export type {
  Alias as ViteAlias,
  BuildEnvironmentOptions as ViteBuildEnvironmentOptions,
  ConfigEnv as ViteConfigEnv,
  LibraryOptions as ViteLibraryOptions,
  UserConfigExport as ViteUserConfigExport,
  Plugin as VitePlugin,
  PluginOption as VitePluginOption,
  Rollup,
  UserConfig as ViteUserConfig,
} from 'vite';

/**
 * System
 */
export type * from '@sys/types';

export type {
  DenoFileJson,
  DenoFileLib,
  DenoFilePath,
  DenoImportMapJson,
  DenoWorkspace,
  DenoWorkspaceChild,
  Dep,
} from '@sys/driver-deno/t';
export type { Process } from '@sys/process/t';
export type { Time } from '@sys/std/t';
export type { CssValue } from '@sys/ui-css/t';

/**
 * Local
 */
export type * from '../types.ts';
