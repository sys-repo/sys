import { Is, type t } from './common.ts';

/**
 * Type guards.
 */
export const CmdIs: t.Cmd.Is.Lib = Object.freeze({
  request: (input: unknown): input is t.Cmd.Wire.Request => isWire(input, 'cmd'),
  event: (input: unknown): input is t.Cmd.Wire.Event => isWire(input, 'cmd:event'),
  response: (input: unknown): input is t.Cmd.Wire.Result => isWire(input, 'cmd:result'),
  cancel: (input: unknown): input is t.Cmd.Wire.Cancel => isWire(input, 'cmd:cancel'),

  error(input: unknown): input is t.Cmd.Error.Instance {
    return input instanceof Error && isCmdErrorKind(input.name);
  },
});

/**
 * Helpers:
 */
function isWire(input: unknown, kind: t.Cmd.Wire.Kind) {
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

function isReqId(input: unknown): input is t.Cmd.ReqId {
  return Is.string(input) && input.startsWith('req-') && input.length > 'req-'.length;
}

function isName(input: unknown): input is t.Cmd.Name {
  return Is.string(input) && input.length > 0;
}

function isNamespace(input: unknown): input is t.Cmd.Namespace | undefined {
  return input === undefined || Is.string(input);
}

function isResponseError(kind: t.Cmd.Wire.Kind, input: unknown) {
  if (kind !== 'cmd:result') return true;
  return input === undefined || Is.string(input);
}

function isCancelReason(kind: t.Cmd.Wire.Kind, input: unknown) {
  if (kind !== 'cmd:cancel') return true;
  return input === undefined || Is.string(input);
}

function isCmdErrorKind(input: string): input is t.Cmd.Error.Kind {
  switch (input) {
    case 'CmdError.Timeout':
    case 'CmdError.ClientDisposed':
    case 'CmdError.Remote':
    case 'CmdError.Cancelled':
      return true;
    default:
      return false;
  }
}
