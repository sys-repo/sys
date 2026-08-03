import type { t } from '../common.ts';
import type { ResourceSnapshot } from './u.snapshot.ts';
import { safeResourceSource } from './u.source.ts';

export const RESOURCE_FAILURE = {
  input: {
    kind: 'invalid-input',
    status: 400,
    error: 'Invalid checksum-pinned pull input',
  },
  policy: {
    kind: 'invalid-policy',
    status: 400,
    error: 'Invalid checksum-pinned pull policy',
  },
  resource: {
    kind: 'invalid-resource',
    status: 400,
    error: 'Invalid checksum-pinned pull resource',
  },
  source: {
    kind: 'source-denied',
    status: 403,
    error: 'Checksum-pinned pull source is not admitted',
  },
  resources: {
    kind: 'resource-limit',
    status: 413,
    error: 'Checksum-pinned pull resource limit exceeded',
  },
  file: {
    kind: 'file-limit',
    status: 413,
    error: 'Checksum-pinned pull file byte limit exceeded',
  },
  aggregate: {
    kind: 'aggregate-limit',
    status: 413,
    error: 'Checksum-pinned pull aggregate byte limit exceeded',
  },
  admission: {
    kind: 'target-admission',
    status: 400,
    error: 'Checksum-pinned pull target admission failed',
  },
  request: {
    kind: 'request-failure',
    error: 'Checksum-pinned pull request failed',
  },
  checksum: {
    kind: 'checksum-mismatch',
    status: 412,
    error: 'Fetched resource checksum does not match expected checksum',
  },
  size: {
    kind: 'size-mismatch',
    status: 412,
    error: 'Fetched resource byte size does not match expected bytes',
  },
  retry: {
    kind: 'retry-limit',
    status: 408,
    error: 'Checksum-pinned pull retry time limit exceeded',
  },
  timeout: {
    kind: 'total-timeout',
    status: 408,
    error: 'Checksum-pinned pull total time limit exceeded',
  },
  publication: {
    kind: 'publication-failure',
    error: 'Checksum-pinned pull publication failed',
  },
  cancelled: {
    kind: 'cancelled',
    status: 499,
    error: 'Pull operation cancelled',
    cancelled: true,
  },
  execution: {
    kind: 'execution-failure',
    status: 500,
    error: 'Checksum-pinned pull execution failed',
  },
} as const satisfies Record<string, t.HttpPull.ResourceTerminalFailure>;

export type ResourceFailure = t.HttpPull.ResourceTerminalFailure & {
  readonly filesystem?: t.HttpPull.RootedFailureEvidence;
};

type FailureState = {
  readonly attempts?: number;
  readonly transferredBytes?: t.NumberBytes;
  readonly target?: t.StringRelativePath | '';
  readonly checksum?: t.HttpPull.ResourceChecksumEvidence;
  readonly actualBytes?: t.NumberBytes;
  readonly requestedUrl?: t.StringUrl;
  readonly finalUrl?: t.StringUrl;
};

/** Build one sanitized checksum-pinned failure record. */
export function failureRecord(
  resource: ResourceSnapshot,
  failure: ResourceFailure,
  state: FailureState = {},
): t.HttpPull.ResourceRecordFailure {
  const common = {
    index: resource.index,
    path: Object.freeze({
      source: resource.source.safe,
      target: state.target ?? '',
    }),
    attempts: state.attempts ?? 0,
    transferredBytes: state.transferredBytes ?? 0,
    ...(state.checksum ? { checksum: Object.freeze(state.checksum) } : {}),
    ...(resource.expectedBytes === undefined ? {} : { expectedBytes: resource.expectedBytes }),
    ...(state.actualBytes === undefined ? {} : { actualBytes: state.actualBytes }),
    ...(state.requestedUrl ? { requestedUrl: safeResourceSource(state.requestedUrl) } : {}),
    ...(state.finalUrl ? { finalUrl: safeResourceSource(state.finalUrl) } : {}),
  };

  if (failure.kind === 'cancelled') {
    return Object.freeze({
      ...common,
      ok: false,
      kind: 'cancelled',
      status: 499,
      error: 'Pull operation cancelled',
      cancelled: true,
    });
  }

  return Object.freeze({
    ...common,
    ok: false,
    kind: failure.kind,
    ...(failure.status === undefined ? {} : { status: failure.status }),
    error: failure.error,
    ...(failure.filesystem ? { filesystem: failure.filesystem } : {}),
  }) as t.HttpPull.ResourceRecordError;
}

/** Reduce Rooted failures to stable non-sensitive evidence. */
export function filesystemEvidence(
  failure: t.Fs.Rooted.Failure,
): t.HttpPull.RootedFailureEvidence {
  return Object.freeze({
    operation: failure.operation,
    kind: failure.kind,
    committed: failure.committed,
  });
}

/** Reduce the private first cause to stable public terminal evidence. */
export function terminalEvidence(
  failure: ResourceFailure,
): t.HttpPull.ResourceTerminalFailure {
  return Object.freeze({
    kind: failure.kind,
    ...(failure.status === undefined ? {} : { status: failure.status }),
    error: failure.error,
    ...(failure.cancelled ? { cancelled: true as const } : {}),
  });
}
