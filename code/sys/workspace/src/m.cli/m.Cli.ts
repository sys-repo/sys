/**
 * @module
 * CLI entrypoints for workspace tooling.
 */
import type { t } from './common.ts';
import { run } from './m.run.ts';

/**
 * CLI runtime surface for dispatching workspace commands.
 */
export const WorkspaceCli: t.WorkspaceCli.Lib = { run };
