import type { t } from './common.ts';
import { createOwnedError } from './u.error.ts';

/** Browser-safe failure categories projected by Driver Pi's boot screen. */
export type BootFailureCategory =
  | 'configuration-invalid'
  | 'source-unavailable'
  | 'artifact-refused'
  | 'repair-required'
  | 'local-failure'
  | 'cancelled';

/** Sanitized materialization failure retained before terminal projection. */
export type MaterializationFailureEvidence =
  | Readonly<{
    stage: 'manifest-fetch';
    reason: 'integrity-mismatch';
    cleanup: 'not-needed';
    publication?: undefined;
    manifestChecksum: t.Dist.ManifestChecksumMismatch;
  }>
  | Readonly<{
    stage: 'manifest-fetch';
    reason: Exclude<t.Dist.FailureReason, 'integrity-mismatch'>;
    cleanup: t.Dist.Cleanup;
    publication?: t.Dist.FailedPublication;
    manifestChecksum?: undefined;
  }>
  | Readonly<{
    stage: Exclude<t.Dist.FailureStage, 'manifest-fetch'>;
    reason: t.Dist.FailureReason;
    cleanup: t.Dist.Cleanup;
    publication?: t.Dist.FailedPublication;
    manifestChecksum?: undefined;
  }>;

/** Sanitized materialization evidence retained by the trusted terminal projection. */
export type MaterializationEvidence = MaterializationFailureEvidence extends infer Evidence
  ? Evidence extends MaterializationFailureEvidence
    ? Readonly<Evidence & { kind: 'materialization' }>
  : never
  : never;

/** Finite evidence retained by a failed boot state. */
export type BootSafeEvidence =
  | Readonly<{
    kind: 'configuration';
    reason: 'manifest-url' | 'integrity' | 'development-directory';
  }>
  | Readonly<{
    kind: 'identity';
    diagnostics?: Readonly<{
      kind: 'refused';
      manifestUrl: t.StringUrl;
      integrity: t.StringHash;
    }>;
  }>
  | MaterializationEvidence
  | Readonly<{
    kind: 'application-host';
    reason: t.DistServer.StartFailureReason;
  }>
  | Readonly<{
    kind: 'local';
    operation:
      | 'authority'
      | 'controls'
      | 'screen'
      | 'release-owner'
      | 'application-host'
      | 'application-listener'
      | 'status-listener';
  }>
  | Readonly<{ kind: 'cancellation' }>;

/** The sole state value projected by the terminal and bootstrap host. */
export type BootState =
  | Readonly<{ kind: 'preparing' }>
  | Readonly<{ kind: 'starting-app-host' }>
  | Readonly<{
    kind: 'ready';
    origin: t.StringUrl;
    digest: t.StringHash;
    directoryHref?: t.StringUrl;
  }>
  | Readonly<{
    kind: 'failed';
    category: BootFailureCategory;
    safeEvidence: BootSafeEvidence;
  }>
  | Readonly<{ kind: 'stopping' }>;

/** Read-only state projection consumed by presentation owners. */
export type BootStateSource = {
  readonly current: BootState;
  /** Invoke one synchronous observer; any work it starts remains observer-owned. */
  subscribe(listener: (state: BootState) => void): () => void;
};

/** Mutable side of Driver Pi's boot-screen state. */
export type BootStateOwner = BootStateSource & {
  set(state: BootState): void;
};

const freeze = Object.freeze;
const PREPARING: Extract<BootState, { kind: 'preparing' }> = freeze({ kind: 'preparing' });
const STARTING: Extract<BootState, { kind: 'starting-app-host' }> = freeze({
  kind: 'starting-app-host',
});
const STOPPING: Extract<BootState, { kind: 'stopping' }> = freeze({ kind: 'stopping' });

/** Owner-created immutable boot-state values. */
export const Boot = freeze({
  preparing: PREPARING,
  startingAppHost: STARTING,
  ready: (
    origin: t.StringUrl,
    digest: t.StringHash,
    directoryHref?: t.StringUrl,
  ): Extract<BootState, { kind: 'ready' }> =>
    freeze({
      kind: 'ready',
      origin,
      digest,
      ...(directoryHref === undefined ? {} : { directoryHref }),
    }),
  failed: (
    category: BootFailureCategory,
    safeEvidence: BootSafeEvidence,
  ): Extract<BootState, { kind: 'failed' }> =>
    freeze({
      kind: 'failed',
      category,
      safeEvidence,
    }),
  stopping: STOPPING,
});

/** Expose only observational state authority to a presentation owner. */
export function bootStateSource(owner: BootStateOwner): BootStateSource {
  return freeze({
    get current() {
      return owner.current;
    },
    subscribe(listener) {
      return owner.subscribe(listener);
    },
  });
}

/** Create one transition-checked state owner beginning at `preparing`. */
export function createBootState(): BootStateOwner {
  let current: BootState = PREPARING;
  let dispatching = false;
  let publicationIndex = 0;
  const publications: BootState[] = [];
  const listeners = new Set<(state: BootState) => void>();
  const publish = () => {
    if (dispatching) return;
    dispatching = true;
    try {
      while (publicationIndex < publications.length) {
        const next = publications[publicationIndex++];
        current = next;
        const snapshot = [...listeners];
        for (let index = 0; index < snapshot.length; index += 1) {
          try {
            snapshot[index](next);
          } catch {
            // A presentation observer cannot break state publication.
          }
        }
      }
    } finally {
      publications.length = 0;
      publicationIndex = 0;
      dispatching = false;
    }
  };

  return freeze({
    get current() {
      return current;
    },
    subscribe(listener) {
      listeners.add(listener);
      let subscribed = true;
      return () => {
        if (!subscribed) return;
        subscribed = false;
        listeners.delete(listener);
      };
    },
    set(next) {
      const previous = publications[publications.length - 1] ?? current;
      if (!allowsTransition(previous.kind, next.kind)) {
        throw createOwnedError('Invalid start:gui boot-state transition.');
      }
      publications.push(next);
      publish();
    },
  });
}

function allowsTransition(from: BootState['kind'], to: BootState['kind']): boolean {
  switch (from) {
    case 'preparing':
      return to === 'starting-app-host' || to === 'failed' || to === 'stopping';
    case 'starting-app-host':
      return to === 'ready' || to === 'failed' || to === 'stopping';
    case 'ready':
      return to === 'failed' || to === 'stopping';
    case 'failed':
      return to === 'stopping';
    case 'stopping':
      return false;
  }
}
