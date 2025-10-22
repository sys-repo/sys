import type { t } from './common.ts';
import { asCommand, printOutput, toProcOutput } from './u.ts';

/**
 * Run a <unix> command (argv) and wait for response.
 */
export const invoke: t.ProcLib['invoke'] = async (config) => {
  const { silent } = config;
  const command = asCommand(config);
  const output = await command.output();
  const res = toProcOutput(output);
  if (!silent) printOutput(res.code, res.stdout, res.stderr);
  return res;
};
