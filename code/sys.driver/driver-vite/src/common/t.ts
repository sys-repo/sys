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

export type {
  DenoFileJson,
  DenoFilePath,
  DenoModuleBackup,
  DenoWorkspace,
} from '@sys/driver-deno/t';
export type { FsPathFilter } from '@sys/fs/t';
export type { ProcHandle, ProcOutput, ProcReadySignalFilter } from '@sys/process/t';
export type { Tmpl, TmplCopyHandler, TmplFileOperation, TmplProcessFile } from '@sys/tmpl/t';
export type { CssValue } from '@sys/ui-css/t';

/**
 * Local
 */
export type * from '../types.ts';
