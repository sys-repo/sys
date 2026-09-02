import type { t } from '../common.ts';

import type { Started } from '../u.deps.ts';
import type { FailedBootState } from '../u.failure.ts';
import type {
  AdmittedApplicationOwner,
  AdmittedMaterialization,
  ApplicationIdentityExpectation,
  ApplicationOwner,
} from '../u.identity.ts';
import type { ReleaseLease } from '../u.materialize.ts';
import type { StartGuiScreenInstance } from '../u.screen/mod.ts';

export type PresentationEvidence = Readonly<{
  kind: 'browser-open-failed';
  url: t.StringUrl;
}>;

export type OwnedCleanupIssue = Readonly<{
  resource:
    | 'screen'
    | 'keyboard'
    | 'state-observer'
    | 'application-host'
    | 'application-listener'
    | 'generation-lease'
    | 'status-listener';
  state: 'failed' | 'unresolved';
}>;

export type MaterializationCleanupIssue = Readonly<{
  resource: 'materialization';
  state: 'unresolved';
  cleanup: 'pending';
  stage?: t.Dist.FailureStage;
  reason?: t.Dist.FailureReason;
  publication?: t.Dist.FailedPublication;
}>;

export type MaterializationSettlementEvidence = Readonly<{
  kind: 'materialization';
  stage: t.Dist.FailureStage;
  reason: t.Dist.FailureReason;
  cleanup: t.Dist.Cleanup;
  publication?: t.Dist.FailedPublication;
}>;

export type CleanupIssue = OwnedCleanupIssue | MaterializationCleanupIssue;

export type CleanupEvidence = Readonly<{
  kind: 'cleanup-failed';
  issues: readonly CleanupIssue[];
}>;

export type StopSource = 'trusted-control' | 'external-cancellation';

export type TerminalEvent =
  | Readonly<{ kind: 'stop'; source: StopSource }>
  | Readonly<{ kind: 'failure'; error: Error; state: FailedBootState }>;

export type WorkAdmission<T> =
  | Readonly<{ kind: 'admitted'; value: T }>
  | Readonly<{ kind: 'blocked'; event: TerminalEvent }>;

export type ObservedReaction = Readonly<{ pending: TerminalEvent | undefined }>;

export type StatusCleanupOwner = Readonly<{
  finished?: Promise<void>;
  close(reason?: unknown): Promise<void>;
}>;

export type StatusOwner =
  & StatusCleanupOwner
  & Readonly<{
    url: t.StringUrl;
    finished: Promise<void>;
  }>;

export type StatusOwnerSnapshot =
  | Readonly<{ kind: 'admitted'; owner: StatusOwner }>
  | Readonly<{ kind: 'invalid'; owner?: StatusCleanupOwner }>;

export type KeyboardCleanupOwner = Readonly<{ dispose(): void }>;
export type KeyboardOwner = KeyboardCleanupOwner & Readonly<{ finished: Promise<void> }>;
export type ScreenCleanupOwner = Readonly<{ dispose(): void }>;
export type ScreenOwner = ScreenCleanupOwner & StartGuiScreenInstance;

export type KeyboardOwnerSnapshot =
  | Readonly<{ kind: 'admitted'; owner: KeyboardOwner }>
  | Readonly<{ kind: 'invalid'; owner?: KeyboardCleanupOwner }>;

export type ScreenOwnerSnapshot =
  | Readonly<{ kind: 'admitted'; owner: ScreenOwner }>
  | Readonly<{ kind: 'invalid'; owner?: ScreenCleanupOwner }>;

export type ListenerObservation = {
  readonly settled: boolean;
  readonly failed: boolean;
  /** Settles only after the owned listener reaction and settlement callbacks terminate. */
  readonly completion: Promise<void>;
  onSettled(listener: () => void): void;
};

export type Supervisor = {
  /** Work cancellation shared by acquisition and the application host. */
  readonly signal: AbortSignal;
  /** First trusted stop, external cancellation, or internal failure observed by this session. */
  readonly terminal: Promise<TerminalEvent>;
  /** Settles when stop is requested or keyboard loss makes foreground interaction impossible. */
  readonly foregroundReleased: Promise<void>;
  /** The final terminal winner, when already settled. */
  readonly currentTerminal: TerminalEvent | undefined;
  /** The final winner or an immediate pending-stop latch that prohibits new work. */
  readonly currentBlocker: TerminalEvent | undefined;
  /** Safe lower settlement retained only when another terminal event kept precedence. */
  readonly materializationEvidence: MaterializationSettlementEvidence | undefined;
  /** Allow direct promise observers to run before the next atomic work admission. */
  checkpoint(): Promise<TerminalEvent | undefined>;
  /** Synchronously admit an unsafe action only while no terminal event blocks new work. */
  admitWork<T>(action: () => T): WorkAdmission<T>;
  /** Request trusted stop and report whether this call owns the first stop latch. */
  requestStop(reason: unknown): boolean;
  /** Publish a synchronous failure; a preceding pending stop retains precedence. */
  publishFailure(error: Error, state: FailedBootState): boolean;
  /** Snapshot the pending candidate before one direct reaction invokes any admitted callback. */
  beginObservedReaction(): ObservedReaction;
  /** Publish from a direct reaction without displacing a candidate created reentrantly within it. */
  publishObservedFailure(
    reaction: ObservedReaction,
    error: Error,
    state: FailedBootState,
  ): boolean;
  /** Publish directly from the package-controlled screen failure source. */
  publishScreenFailure(cause: unknown): void;
  recordMaterialization(result: AdmittedMaterialization): void;
  recordUnobservableOperation(
    resource: 'materialization' | 'application-host',
    transport: unknown,
  ): void;
  recordUnobservableControl(resource: 'keyboard' | 'screen'): void;
  setKeyboard(keyboard: unknown): void;
  setScreen(screen: unknown): ScreenOwner;
  setApplication(
    started: Started,
    expected: ApplicationIdentityExpectation,
  ): AdmittedApplicationOwner;
  setLease(lease: ReleaseLease): void;
  close(): Promise<CleanupEvidence | undefined>;
  /** Perform every synchronous cleanup step when Promise transport is already unavailable. */
  closeInvalidTransport(): CleanupEvidence | undefined;
};

export type CleanupInput = {
  readonly status: StatusOwner;
  readonly statusObservation?: ListenerObservation;
  readonly stopLife: t.Abortable;
  readonly workLife: t.Abortable;
  readonly stateObserverFailed: boolean;
  readonly materializationIssues: readonly MaterializationCleanupIssue[];
  readonly unobservableIssues: readonly OwnedCleanupIssue[];
  readonly unobservableWork: boolean;
  readonly screen?: ScreenCleanupOwner;
  readonly keyboard?: KeyboardCleanupOwner;
  readonly keyboardObservation?: ListenerObservation;
  readonly closeApplication: () => Promise<void>;
  readonly application?: ApplicationOwner;
  readonly applicationObservation?: ListenerObservation;
  readonly applicationCloseFailed: boolean;
  readonly lease?: ReleaseLease;
};

export type DisposalResult = 'clean' | 'recovered' | 'unresolved';
