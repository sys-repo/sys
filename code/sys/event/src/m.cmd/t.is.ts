import type { t } from './common.ts';

/**
 * Type guards.
 */
export type CmdIsLib = {
  request(input: unknown): input is t.CmdEnvelope;
  event(input: unknown): input is t.CmdEventEnvelope;
  response(input: unknown): input is t.CmdResultEnvelope;
  cancel(input: unknown): input is t.CmdCancelEnvelope;
  error(input: unknown): input is t.CmdError;
};
