import { type t } from './common.ts';
import { run as runCli } from '../m.cli/m.run.ts';
import { resolveRun } from './u.resolve.run.ts';

export const run: t.PiCliProfiles.Lib['run'] = async (input) => {
  const resolved = await resolveRun(input);
  return await runCli(resolved);
};
