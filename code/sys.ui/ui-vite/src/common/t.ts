/**
 * External
 */
export type { Rollup, ConfigEnv as ViteConfigEnv, UserConfig as ViteUserConfig } from 'npm:vite';

/**
 * System
 */
export type { DenoWorkspace, DenofileJson } from '@sys/driver-deno/t';
export type { CmdOutput, CmdProcessHandle } from '@sys/std-s/t';
export type { Pkg, StringPath, StringUrl } from '@sys/std/t';

/**
 * Local
 */
export type * from '../types.ts';
