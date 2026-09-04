import { DistServer, Is, type t } from './common.ts';
import { isConfigurationError } from './u.authority.ts';
import { isIdentityError } from './u.identity/mod.ts';
import { createOwnedError, markOwnedError, ownedError } from './u.error.ts';
import { isMaterializationError, materializationError } from './u.failure.materialization.ts';
import {
  Boot,
  type BootSafeEvidence,
  type BootState,
  type MaterializationEvidence,
} from './u.state.ts';

export type FailedBootState = Extract<BootState, { readonly kind: 'failed' }>;
export type FailureOperation = Extract<
  BootSafeEvidence,
  { readonly kind: 'local' }
>['operation'];

export type CapturedFailure = Readonly<{
  error: Error;
  state: FailedBootState;
}>;

const GENERATION_CANCELLATIONS = new WeakSet<object>();

/** Capture an arbitrary rejection as bounded terminal evidence. */
export function captureFailure(
  cause: unknown,
  operation: FailureOperation,
): CapturedFailure {
  const state = failedBootState(cause, operation);
  const error = isAuthenticatedFailure(cause)
    ? markOwnedError(cause)
    : ownedError(cause, `start:gui ${operation} failed.`);
  return Object.freeze({ error, state });
}

/** Map one trusted-side failure to browser-safe category and terminal-safe evidence. */
export function failedBootState(
  cause: unknown,
  operation: FailureOperation,
): FailedBootState {
  if (isConfigurationError(cause)) {
    return Boot.failed(
      'configuration-invalid',
      Object.freeze({ kind: 'configuration', reason: cause.configuration }),
    );
  }
  if (isIdentityError(cause)) {
    return Boot.failed(
      operation === 'authority' ? 'configuration-invalid' : 'artifact-refused',
      Object.freeze({
        kind: 'identity',
        ...(cause.identity ? { diagnostics: Object.freeze({ ...cause.identity }) } : {}),
      }),
    );
  }
  if (isGenerationCancellation(cause)) return cancelledBootState();
  if (isMaterializationError(cause)) {
    const evidence: MaterializationEvidence = Object.freeze({
      kind: 'materialization',
      ...cause.materialization,
    });
    return Boot.failed(materializationCategory(evidence), evidence);
  }
  if (DistServer.Error.is(cause)) {
    const evidence = Object.freeze({
      kind: 'application-host' as const,
      reason: cause.reason,
    });
    return Boot.failed(hostCategory(cause.reason), evidence);
  }
  return Boot.failed('local-failure', Object.freeze({ kind: 'local', operation }));
}

/** Convert one failed Generation opening into Driver Pi's finite failure vocabulary. */
export function generationOpenError(input: t.Dist.Generation.Failure.Result): Error {
  if (input.generation) return materializationError(input.generation);
  if (input.reason !== 'cancelled') return createOwnedError('start:gui release-owner failed.');
  const error = createOwnedError('start:gui generation opening cancelled.');
  GENERATION_CANCELLATIONS.add(error);
  return error;
}

/** Create one fixed local listener failure without retaining a lower cause. */
export function listenerFailure(
  resource: 'application-listener' | 'status-listener',
): CapturedFailure {
  const message = resource === 'application-listener'
    ? 'start:gui application listener stopped.'
    : 'start:gui bootstrap listener stopped.';
  return Object.freeze({
    error: createOwnedError(message),
    state: Boot.failed(
      'local-failure',
      Object.freeze({ kind: 'local', operation: resource }),
    ),
  });
}

/** Create the finite cancelled state used when trusted cancellation wins startup. */
export function cancelledBootState(): FailedBootState {
  return Boot.failed('cancelled', Object.freeze({ kind: 'cancellation' }));
}

function isAuthenticatedFailure(input: unknown): input is Error {
  return isConfigurationError(input) || isIdentityError(input) ||
    isGenerationCancellation(input) || isMaterializationError(input) ||
    DistServer.Error.is(input);
}

function isGenerationCancellation(input: unknown): input is Error {
  return Is.object(input) && GENERATION_CANCELLATIONS.has(input);
}

function materializationCategory(
  evidence: MaterializationEvidence,
): FailedBootState['category'] {
  if (evidence.reason === 'cancelled') return 'cancelled';
  if (evidence.stage === 'existing-verification' && evidence.publication === 'occupied') {
    return 'repair-required';
  }
  if (evidence.reason === 'invalid-input' || evidence.reason === 'invalid-policy') {
    return 'configuration-invalid';
  }
  if (
    (evidence.stage === 'manifest-fetch' || evidence.stage === 'resource-pull') &&
    (evidence.reason === 'source-denied' || evidence.reason === 'timeout' ||
      evidence.reason === 'resource-failure')
  ) return 'source-unavailable';
  if (
    evidence.reason === 'filesystem-failure' || evidence.reason === 'unsupported' ||
    evidence.reason === 'execution-failure'
  ) return 'local-failure';
  return 'artifact-refused';
}

function hostCategory(reason: t.DistServer.StartFailureReason): FailedBootState['category'] {
  if (reason === 'cancelled') return 'cancelled';
  if (reason === 'invalid-input' || reason === 'invalid-hostname') {
    return 'configuration-invalid';
  }
  if (
    reason === 'io-failure' || reason === 'unsupported' || reason === 'address-in-use' ||
    reason === 'startup-failure'
  ) return 'local-failure';
  return 'artifact-refused';
}
