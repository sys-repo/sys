import type { t } from './common.ts';
import { Script } from './m.Script.ts';
import { sh } from './u.proc.sh.ts';

/**
 * Runs a multiline shell script with sane defaults
 * for strictness and output control.
 */
export const run: t.ProcLib['run'] = async (script, opts = {}) => {
  const clean = Script.tight`${script}`;
  return sh(opts).run(clean);
};
