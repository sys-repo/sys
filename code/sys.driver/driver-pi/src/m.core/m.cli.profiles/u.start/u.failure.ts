import { DistServer, StartGuiIntrinsic, type t } from './common.ts';
import { isConfigurationError } from './u.authority.ts';
import { isIdentityError } from './u.identity.ts';
import { createOwnedError, markOwnedError, ownedError } from './u.error.ts';
import { isMaterializationError } from './u.materialize.ts';
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

const apply = Reflect.apply;
const distServerErrorIs = DistServer.Error.is;
const freeze = Object.freeze;

/** Capture an arbitrary rejection without invoking caller-controlled object behavior. */
export function captureFailure(
  cause: unknown,
  operation: FailureOperation,
): CapturedFailure {
  const state = failedBootState(cause, operation);
  const error = isAuthenticatedFailure(cause)
    ? markOwnedError(cause)
    : ownedError(cause, `start:gui ${operation} failed.`);
  return freeze({ error, state });
}

/** Map one trusted-side failure to browser-safe category and terminal-safe evidence. */
export function failedBootState(
  cause: unknown,
  operation: FailureOperation,
): FailedBootState {
  if (isConfigurationError(cause)) {
    return Boot.failed(
      'configuration-invalid',
      freeze({ kind: 'configuration', reason: cause.configuration }),
    );
  }

  if (isIdentityError(cause)) {
    const identity = cause.identity;
    return Boot.failed(
      operation === 'authority' ? 'configuration-invalid' : 'artifact-refused',
      freeze({
        kind: 'identity',
        ...(identity ? { diagnostics: freeze({ ...identity }) } : {}),
      }),
    );
  }

  if (isMaterializationError(cause)) {
    const safeEvidence: MaterializationEvidence = freeze({
      kind: 'materialization',
      ...cause.materialization,
    });
    return Boot.failed(materializationCategory(safeEvidence), safeEvidence);
  }

  if (isDistServerError(cause)) {
    const evidence = freeze({
      kind: 'application-host' as const,
      reason: cause.reason,
    });
    return Boot.failed(hostCategory(cause.reason), evidence);
  }

  return Boot.failed(
    'local-failure',
    freeze({ kind: 'local', operation }),
  );
}

/** Create one fixed local listener failure without retaining a lower cause. */
export function listenerFailure(
  resource: 'application-listener' | 'status-listener',
): Readonly<{ error: Error; state: FailedBootState }> {
  const message = resource === 'application-listener'
    ? 'start:gui application listener stopped.'
    : 'start:gui bootstrap listener stopped.';
  return freeze({
    error: createOwnedError(message),
    state: Boot.failed(
      'local-failure',
      freeze({ kind: 'local', operation: resource }),
    ),
  });
}

/** Create the finite cancelled state used when trusted cancellation wins startup. */
export function cancelledBootState(): FailedBootState {
  return Boot.failed(
    'cancelled',
    freeze({ kind: 'cancellation' }),
  );
}

function isAuthenticatedFailure(input: unknown): input is Error {
  return isConfigurationError(input) || isIdentityError(input) ||
    isMaterializationError(input) || isDistServerError(input);
}

function isDistServerError(input: unknown): input is t.DistServer.StartError {
  return StartGuiIntrinsic.weakSetPrototypeReady() &&
    apply(distServerErrorIs, undefined, [input]) === true;
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
  ) {
    return 'source-unavailable';
  }
  if (
    evidence.reason === 'filesystem-failure' || evidence.reason === 'unsupported' ||
    evidence.reason === 'execution-failure'
  ) {
    return 'local-failure';
  }
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
  ) {
    return 'local-failure';
  }
  return 'artifact-refused';
}
