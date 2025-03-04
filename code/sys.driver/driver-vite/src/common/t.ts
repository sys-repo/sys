/**
 * External
 */
export type {
  Rollup,
  Alias as ViteAlias,
  BuildEnvironmentOptions as ViteBuildEnvironmentOptions,
  ConfigEnv as ViteConfigEnv,
  LibraryOptions as ViteLibraryOptions,
  Plugin as VitePlugin,
  PluginOption as VitePluginOption,
  UserConfig as ViteUserConfig,
} from 'vite';

/**
 * System
 */
export type * from '@sys/std/t';

export type {
  DenoFileJson,
  DenoFilePath,
  DenoImportMapJson,
  DenoModuleBackup,
  DenoWorkspace,
  DenoWorkspaceChild,
  Dep,
} from '@sys/driver-deno/t';
export type { FsPathFilter } from '@sys/fs/t';
export type { ProcHandle, ProcOutput, ProcReadySignalFilter } from '@sys/process/t';
export type { Tmpl, TmplWriteHandler, TmplFileOperation, TmplProcessFile } from '@sys/tmpl/t';
export type { CssValue } from '@sys/ui-css/t';

/**
 * Local
 */
export type * from '../types.ts';
