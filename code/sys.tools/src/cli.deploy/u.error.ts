import { R2 } from '@sys/driver-cloudflare/r2';
import { Is, Num, type t } from './common.ts';

type Observation = {
  readonly diagnostic: t.DeployTool.Error.Diagnostic;
  readonly permission: Error | undefined;
};
type Failure = t.DeployTool.PushOperation.Failure | t.DeployTool.PushOperation.DocumentFailure;

const observations = new WeakMap<object, Observation>();

/**
 * Captured Deploy failure observations, keyed by exact exception identity.
 */
export const DeployError: t.DeployTool.Error.Lib = Object.freeze({
  /**
   * Retrieve captured safe facts for exactly this error identity.
   */
  diagnostic: (error) => observation(error)?.diagnostic,
  /**
   * Retrieve the separately captured denial identity, without traversing causes.
   */
  permission: (error) => observation(error)?.permission,
});

/** Capture a fresh push exception before rendering its message from mutable failure data. */
export function capturePushError(result: Failure): Error {
  const error = new Error('', { cause: result });
  const reason = reasonOf(result.reason);
  // Only input admission supplies missing names; provider metadata is not setup advice.
  const missingEnv = reason === 'yaml-invalid' && result.missingEnv?.length
    ? Object.freeze([...result.missingEnv])
    : undefined;
  observations.set(error, capture(result.error, reason, missingEnv));
  return error;
}

/** Record the first observation without replacing the exception or adding call-specific facts. */
export function capturePushException(error: unknown): void {
  if (!Is.object(error) || observations.has(error)) return;
  observations.set(error, capture(error, 'failed'));
}

/**
 * Helpers:
 */
function observation(error: unknown): Observation | undefined {
  return Is.object(error) ? observations.get(error) : undefined;
}

function capture(
  error: unknown,
  reason: t.DeployTool.Error.Diagnostic['reason'],
  missingEnv?: readonly string[],
): Observation {
  let permission: Error | undefined;
  let r2: t.R2.Error.Diagnostic | undefined;
  // Keep the observations independent; classification failure must not replace the exception.
  try {
    permission = R2.Error.permission(error);
  } catch { /* No supported permission observation. */ }
  try {
    const detail = R2.Error.diagnostic(error);
    if (detail) {
      // Validate the captured status; an upstream accessor may change between classifier reads.
      const { operation, status, code } = detail;
      r2 = Object.freeze({
        operation,
        ...(Num.Is.safeInt(status) && status >= 100 && status <= 599 ? { status } : {}),
        ...(code === undefined ? {} : { code }),
      });
    }
  } catch { /* No supported transport observation. */ }
  return Object.freeze({
    permission,
    diagnostic: Object.freeze({
      reason,
      ...(missingEnv ? { missingEnv } : {}),
      ...(r2 ? { r2 } : {}),
    }),
  });
}

function reasonOf(reason: Failure['reason']): t.DeployTool.Error.Diagnostic['reason'] {
  switch (reason) {
    case 'yaml-invalid':
    case 'no-provider':
    case 'no-push-targets':
    case 'no-staging-output':
      return reason;
    default:
      return 'failed';
  }
}
