import { type t } from './common.ts';

/**
 * Runtime type guards for wire envelopes.
 */
export function isCmdEnvelope(input: unknown): input is t.CmdEnvelope {
  const msg = input as t.CmdEnvelope | undefined;
  return !!msg && msg.kind === 'cmd' && typeof msg.id === 'string' && typeof msg.name === 'string';
}

export function isCmdResultEnvelope(input: unknown): input is t.CmdResultEnvelope {
  const msg = input as t.CmdResultEnvelope | undefined;
  return (
    !!msg && msg.kind === 'cmd:result' && typeof msg.id === 'string' && typeof msg.name === 'string'
  );
}

/**
 * Simple id generator: use crypto.randomUUID if available, otherwise a monotonic counter.
 */
let idCounter = 0;
export function createId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  idCounter += 1;
  return `cmd-${idCounter}`;
}
