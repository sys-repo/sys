import { type t, Is } from './common.ts';

/**
 * Type guards.
 */
export const CmdIs: t.CmdIsLib = {
  request(input: unknown): input is t.CmdEnvelope {
    if (!Is.record(input)) return false;
    const msg = input as t.CmdEnvelope;
    return msg.kind === 'cmd' && Is.string(msg.id) && Is.string(msg.name);
  },

  event(input: unknown): input is t.CmdEventEnvelope {
    if (!Is.record(input)) return false;
    const msg = input as t.CmdEventEnvelope;
    return msg.kind === 'cmd:event' && Is.string(msg.id) && Is.string(msg.name);
  },

  response(input: unknown): input is t.CmdResultEnvelope {
    if (!Is.record(input)) return false;
    const msg = input as t.CmdResultEnvelope;
    return msg.kind === 'cmd:result' && Is.string(msg.id) && Is.string(msg.name);
  },

  error(input: unknown): input is t.CmdError {
    return (
      input instanceof Error &&
      typeof (input as Error).name === 'string' &&
      (input as Error).name.startsWith('CmdError')
    );
  },
};
