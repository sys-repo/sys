import { Cmd, Is, Num, type t } from './common.ts';

const NAME = 'R2RequestError';
const OPERATIONS: readonly t.R2.Error.Operation[] = [
  'stat',
  'read',
  'write',
  'remove',
  'list',
  'presign',
];
const CODES: readonly t.R2.Error.Code[] = [
  'AccessDenied',
  'InvalidAccessKeyId',
  'SignatureDoesNotMatch',
  'NoSuchBucket',
  'NoSuchKey',
  'RequestTimeTooSkewed',
  'ExpiredToken',
  'InvalidToken',
  'SlowDown',
  'InternalError',
  'ServiceUnavailable',
  'InvalidRequest',
  'InvalidArgument',
  'AuthorizationHeaderMalformed',
  'RequestTimeout',
  'NotImplemented',
];

export const R2Error: t.R2.Error.Lib = Object.freeze({
  diagnostic(error) {
    for (const value of causes(error)) {
      if (value.name === NAME) {
        const detail = capture(value.data);
        if (detail) return detail;
      }
    }
    return undefined;
  },
  permission(error) {
    for (const value of causes(error)) {
      if (value.name !== 'NotCapable' && value.name !== 'PermissionDenied') continue;
      if (Is.error(value)) return value;
      const denial = new Error('R2 operation blocked by runtime permissions.');
      denial.name = value.name;
      return denial;
    }
    return undefined;
  },
  format(input) {
    const detail = capture(input);
    if (!detail) return 'R2 request failed.';
    const facts = [
      ...(detail.status === undefined ? [] : [`HTTP ${detail.status}`]),
      ...(detail.code === undefined ? [] : [detail.code]),
    ];
    const suffix = facts.length ? `: ${facts.join(', ')}` : '';
    return `R2 ${detail.operation} failed${suffix}.`;
  },
});

/** Transport-owned projection: no message parsing, raw cause, or unrecognized code forwarding. */
export function requestFailure(operation: t.R2.Error.Operation, error: unknown): Error {
  if (Is.record(error) && (error.name === 'NotCapable' || error.name === 'PermissionDenied')) {
    return Cmd.Error.expose({
      name: error.name,
      message: `R2 ${operation} blocked by runtime permissions.`,
    });
  }
  const known = R2Error.diagnostic(error);
  const source = Is.record(error) ? error : {};
  const detail = known ?? capture({ operation, status: source.statusCode, code: source.code });
  if (!detail) throw new TypeError('Invalid R2 request operation.');
  return exposeDiagnostic(detail);
}

/** Re-expose a known safe projection when crossing the Files handler boundary. */
export function exposeDiagnostic(detail: t.R2.Error.Diagnostic): Error {
  return Cmd.Error.expose({ name: NAME, message: R2Error.format(detail), data: { ...detail } });
}

/** Bounded traversal of the error wrappers used by Files and Deploy. */
function* causes(error: unknown): Generator<Record<string, unknown>> {
  const pending = [error];
  const seen = new Set<unknown>();
  while (pending.length && seen.size < 32) {
    const value = pending.pop();
    if (seen.has(value) || !Is.record(value)) continue;
    seen.add(value);
    yield value;
    if ('cause' in value) pending.push(value.cause);
    if ('error' in value) pending.push(value.error);
  }
}

function capture(input: unknown): t.R2.Error.Diagnostic | undefined {
  if (!Is.record(input)) return;
  const operation = OPERATIONS.find((value) => value === input.operation);
  if (!operation) return;
  const status = Num.Is.safeInt(input.status) && input.status >= 100 && input.status <= 599
    ? input.status
    : undefined;
  const code = CODES.find((value) => value === input.code);
  return Object.freeze({
    operation,
    ...(status === undefined ? {} : { status }),
    ...(code === undefined ? {} : { code }),
  });
}
