import { Err, Fs, HttpClient, Is, Num, type t } from '../common.ts';
import type { PreparedResource } from './u.resource.admit.ts';
import {
  failureRecord,
  filesystemEvidence,
  RESOURCE_FAILURE,
  type ResourceFailure,
} from './u.resource.failure.ts';
import type { PolicySnapshot } from './u.resource.input.ts';
import type { ResourceSnapshot } from './u.resource.snapshot.ts';
import { createDeadline, type Deadline, waitForRetry } from './u.resource.time.ts';

export type ResourceState = {
  resource: ResourceSnapshot | PreparedResource;
  attempts: number;
  transferredBytes: t.NumberBytes;
  actualBytes?: t.NumberBytes;
  requestedUrl?: t.StringUrl;
  finalUrl?: t.StringUrl;
  checksum: t.HttpPull.ResourceChecksumEvidence;
};

type TransferAuthority = {
  readonly client: t.HttpFetch.Instance;
  readonly policy: PolicySnapshot;
  readonly rooted: t.Fs.Rooted.Instance;
  readonly signal: AbortSignal;
  readonly resourceCount: number;
  readonly stopped: () => ResourceFailure | undefined;
  readonly startedAttempt: () => void;
  readonly chargeBytes: (state: ResourceState, delta: number) => void;
  readonly emit: (event: t.HttpPull.ResourceEvent.Any) => void;
};

const RETRYABLE_STATUS = new Set([408, 425, 429, 500, 502, 503, 504, 520]);

/** Create mutable private accounting for one immutable resource snapshot. */
export function createResourceState(resource: ResourceSnapshot): ResourceState {
  return {
    resource,
    attempts: 0,
    transferredBytes: 0,
    checksum: Object.freeze({ expected: resource.checksum }),
  };
}

/** Transfer, authenticate, and no-clobber publish one admitted resource. */
export async function transferResource(
  resource: PreparedResource,
  state: ResourceState,
  authority: TransferAuthority,
): Promise<t.HttpPull.ResourceRecord> {
  const firstAttemptAt = performance.now();

  while (true) {
    const stopped = authority.stopped();
    if (stopped) return resourceFailureRecord(resource, state, stopped);

    let retryExpired = false;
    let retryDeadline: Deadline | undefined;
    let retryController: AbortController | undefined;
    if (state.attempts > 0) {
      retryController = new AbortController();
      retryDeadline = createDeadline(firstAttemptAt, authority.policy.maxRetryElapsed, () => {
        retryExpired = true;
        retryController?.abort(Err.std('Retry time limit exceeded', {
          name: 'HttpPullRetryTerminal',
        }));
      });
      if (retryDeadline.expired()) {
        retryDeadline.cancel();
        return resourceFailureRecord(resource, state, RESOURCE_FAILURE.retry);
      }
    }

    state.attempts++;
    authority.startedAttempt();
    const attempt = state.attempts;
    let attemptLoaded = 0;
    let response: t.HttpFetch.Response<Blob>;
    try {
      response = await authority.client.blob(
        resource.source.href,
        retryController ? { signal: retryController.signal } : {},
        {
          checksum: resource.checksum,
          onProgress: (event) => {
            state.requestedUrl = event.requestedUrl;
            state.finalUrl = event.finalUrl;
            const delta = event.loaded - attemptLoaded;
            if (!Num.Is.safeInt(delta) || delta < 0) {
              throw Err.std('Invalid Fetch progress evidence', {
                name: 'HttpPullProgressError',
              });
            }
            attemptLoaded = event.loaded;
            if (event.complete) state.actualBytes = event.loaded;
            if (delta > 0) authority.chargeBytes(state, delta);
            if (authority.stopped()) {
              throw Err.std('Pull operation stopped', { name: 'HttpPullTerminal' });
            }
            authority.emit({
              kind: 'progress',
              index: resource.index,
              total: authority.resourceCount,
              url: resource.source.safe,
              attempt,
              loaded: event.loaded,
              ...(event.total === undefined ? {} : { bytes: event.total }),
              transferredBytes: state.transferredBytes,
            });
          },
        },
      );
    } catch (cause) {
      if (retryExpired) {
        return resourceFailureRecord(resource, state, RESOURCE_FAILURE.retry);
      }
      throw cause;
    } finally {
      retryDeadline?.cancel();
    }

    const terminal = authority.stopped();
    if (terminal) return resourceFailureRecord(resource, state, terminal);
    if (retryExpired) return resourceFailureRecord(resource, state, RESOURCE_FAILURE.retry);

    if (!response.ok) {
      if (response.checksum) state.checksum = Object.freeze({ ...response.checksum });
      if (response.checksum?.valid === false) {
        return resourceFailureRecord(resource, state, RESOURCE_FAILURE.checksum, response.status);
      }
      if (response.error.policyFailure === 'response-too-large') {
        return resourceFailureRecord(resource, state, RESOURCE_FAILURE.file, response.status);
      }

      const retryable = !response.error.policyFailure && RETRYABLE_STATUS.has(response.status);
      if (retryable && attempt < authority.policy.maxAttempts) {
        const waited = await waitForRetry(
          authority.policy.retryDelay,
          firstAttemptAt,
          authority.policy.maxRetryElapsed,
          authority.signal,
        );
        const stopped = authority.stopped();
        if (stopped) return resourceFailureRecord(resource, state, stopped);
        if (!waited) return resourceFailureRecord(resource, state, RESOURCE_FAILURE.retry);
        continue;
      }
      return resourceFailureRecord(resource, state, RESOURCE_FAILURE.request, response.status);
    }

    state.requestedUrl = response.requestedUrl;
    state.finalUrl = response.finalUrl;
    state.actualBytes = response.data.size as t.NumberBytes;
    if (response.checksum) state.checksum = Object.freeze({ ...response.checksum });

    const checksum = response.checksum;
    if (
      !checksum?.valid ||
      checksum.expected !== resource.checksum ||
      checksum.actual !== resource.checksum
    ) {
      return resourceFailureRecord(resource, state, RESOURCE_FAILURE.checksum, 412);
    }
    if (resource.expectedBytes !== undefined && state.actualBytes !== resource.expectedBytes) {
      return resourceFailureRecord(resource, state, RESOURCE_FAILURE.size, 412);
    }
    const stoppedBeforeRead = authority.stopped();
    if (stoppedBeforeRead) return resourceFailureRecord(resource, state, stoppedBeforeRead);

    let bytes: Uint8Array;
    try {
      bytes = await HttpClient.toUint8Array(response.data);
    } catch {
      return resourceFailureRecord(resource, state, RESOURCE_FAILURE.request, 520);
    }
    const stoppedBeforePublish = authority.stopped();
    if (stoppedBeforePublish) {
      return resourceFailureRecord(resource, state, stoppedBeforePublish);
    }
    if (bytes.byteLength !== state.actualBytes) {
      return resourceFailureRecord(resource, state, RESOURCE_FAILURE.size, 412);
    }

    try {
      const publication = await authority.rooted.publishFile(resource.target.handle, bytes, {
        until: authority.signal,
      });
      if (publication.kind !== 'published' || publication.bytes !== bytes.byteLength) {
        return resourceFailureRecord(resource, state, RESOURCE_FAILURE.publication);
      }
      return Object.freeze({
        ok: true,
        index: resource.index,
        path: Object.freeze({ source: resource.source.safe, target: resource.target.path }),
        attempts: state.attempts,
        transferredBytes: state.transferredBytes,
        checksum: Object.freeze({ ...checksum, valid: true as const }),
        ...(resource.expectedBytes === undefined ? {} : { expectedBytes: resource.expectedBytes }),
        actualBytes: state.actualBytes,
        requestedUrl: response.requestedUrl,
        finalUrl: response.finalUrl,
        status: response.status,
        bytes: publication.bytes,
        filesystem: Object.freeze({
          operation: 'publish-file' as const,
          committed: true as const,
        }),
      });
    } catch (cause) {
      const filesystem = Fs.Capability.Rooted.Is.failure(cause)
        ? filesystemEvidence(cause)
        : undefined;
      return resourceFailureRecord(resource, state, {
        ...RESOURCE_FAILURE.publication,
        ...(filesystem ? { filesystem } : {}),
      });
    }
  }
}

/** Build one failure record from the operation's private transfer accounting. */
export function resourceFailureRecord(
  resource: ResourceSnapshot,
  state: ResourceState,
  failure: ResourceFailure,
  status?: t.HttpStatusCode,
): t.HttpPull.ResourceRecordFailure {
  return failureRecord(
    resource,
    status === undefined ? failure : { ...failure, status },
    {
      attempts: state.attempts,
      transferredBytes: state.transferredBytes,
      target: resourceTarget(resource),
      checksum: state.checksum,
      actualBytes: state.actualBytes,
      requestedUrl: state.requestedUrl,
      finalUrl: state.finalUrl,
    },
  );
}

/** Whether publication truth must survive a competing operation terminal cause. */
export function isCommittedResource(record: t.HttpPull.ResourceRecord): boolean {
  return record.ok || record.filesystem?.committed === true;
}

function resourceTarget(resource: ResourceSnapshot): t.StringRelativePath | '' {
  try {
    const target = resource.target as ResourceSnapshot['target'] & { readonly path?: unknown };
    return Is.str(target.path) ? target.path : '';
  } catch {
    return '';
  }
}
