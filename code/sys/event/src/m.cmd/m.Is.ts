import { type t, Is } from './common.ts';

/**
 * Type guards.
 */
export const CmdIs: t.CmdIsLib = {
  request: (input: unknown): input is t.CmdEnvelope => isWire(input, 'cmd'),
  event: (input: unknown): input is t.CmdEventEnvelope => isWire(input, 'cmd:event'),
  response: (input: unknown): input is t.CmdResultEnvelope => isWire(input, 'cmd:result'),
  cancel: (input: unknown): input is t.CmdCancelEnvelope => isWire(input, 'cmd:cancel'),

  error(input: unknown): input is t.CmdError {
    return input instanceof Error && isCmdErrorKind(input.name);
  },
};

/**
 * Helpers:
 */
function isWire(input: unknown, kind: t.CmdKind) {
  if (!Is.record(input)) return false;

  const msg = input as Record<string, unknown>;
  return (
    msg.kind === kind &&
    isReqId(msg.id) &&
    isName(msg.name) &&
    isNamespace(msg.ns) &&
    isResponseError(kind, msg.error) &&
    isCancelReason(kind, msg.reason)
  );
}

function isReqId(input: unknown): input is t.CmdReqId {
  return Is.string(input) && input.startsWith('req-') && input.length > 'req-'.length;
}

function isName(input: unknown): input is t.CmdName {
  return Is.string(input) && input.length > 0;
}

function isNamespace(input: unknown): input is t.CmdNamespace | undefined {
  return input === undefined || Is.string(input);
}

function isResponseError(kind: t.CmdKind, input: unknown) {
  if (kind !== 'cmd:result') return true;
  return input === undefined || Is.string(input);
}

function isCancelReason(kind: t.CmdKind, input: unknown) {
  if (kind !== 'cmd:cancel') return true;
  return input === undefined || Is.string(input);
}

function isCmdErrorKind(input: string): input is t.CmdErrorKind {
  switch (input) {
    case 'CmdErrorTimeout':
    case 'CmdErrorClientDisposed':
    case 'CmdErrorRemote':
    case 'CmdErrorCancelled':
      return true;
    default:
      return false;
  }
}
