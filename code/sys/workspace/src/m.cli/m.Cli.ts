/**
 * @module
 * CLI entrypoints for workspace tooling.
 */
import type { t } from './common.ts';
import { run } from './m.run.ts';

export const WorkspaceCli: t.WorkspaceCli.Lib = { run };
