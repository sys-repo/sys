import type { t } from './common.ts';

/**
 * Type guards.
 */
export type CmdIsLib = {
  request(input: unknown): input is t.CmdEnvelope;
  response(input: unknown): input is t.CmdResultEnvelope;
};
