import type { t } from './common.ts';
import { resolvePackage } from './u.package.ts';

/** Shared Deno resolver facts for package specifiers. */
export const WorkspaceResolve: t.WorkspaceResolve.Lib = { resolvePackage };
