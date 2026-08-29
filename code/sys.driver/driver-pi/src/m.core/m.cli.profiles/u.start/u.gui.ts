import { Cli, Fs, Is, Rx, StartGuiIntrinsic, type t } from './common.ts';

import { snapshotCapturedAbortSignal } from './u.abort.ts';
import { snapshotAuthorityEvidence } from './u.authority.ts';
import { startBootstrap } from './u.bootstrap.ts';
import { VERIFIED_LOOPBACK_BROWSER_POLICY } from './u.browser.ts';
import { DEFAULT_DEPENDENCIES, type StartGuiDependencies } from './u.deps.ts';
import { createOwnedError, ownedError } from './u.error.ts';
import { cancelledBootState, captureFailure, type FailureOperation } from './u.failure.ts';
import { admitGenerationPkg, admitMaterialization, type AdmittedGeneration } from './u.identity.ts';
import {
  type CleanupEvidence,
  createSupervisor,
  finalError,
  type PresentationEvidence,
  retainUnobservableStatusOperation,
  retainUnsupervisedStatus,
  snapshotStatusOwner,
  type StatusOwner,
  type StopSource,
  type Supervisor,
  type TerminalEvent,
  type WorkAdmission,
} from './u.lifecycle.ts';
import { materializationError, materialize, prepareReleaseOwner } from './u.materialize.ts';
import { LIMITS } from './u.limits.ts';
import {
  createPromiseDeferred,
  isPromiseTransportReady,
  observePromiseTransport,
  PROMISE_TRANSPORT_ERROR,
  resolvedPromise,
} from './u.promise.ts';
import { Boot, bootStateSource, createBootState } from './u.state.ts';
import { captureFileHref } from './u.url.ts';
import {
  START_GUI_SERVICE,
  type StartGuiEvidence,
  type StartGuiRecoveryPolicy,
} from '../u/u.start.gui.service.ts';
import { markCliSettledFailure } from '../u/u.start.gui.settlement.ts';

export type { StartGuiDependencies } from './u.deps.ts';

type KeyboardEvent = Parameters<NonNullable<Parameters<typeof Cli.Keyboard.bind>[0]['onKey']>>[0];

type BootResult =
  | Readonly<{ kind: 'ready' }>
  | Readonly<{ kind: 'failed' }>
  | Readonly<{ kind: 'stop'; source: StopSource }>;

type Observed<T> =
  | Readonly<{ kind: 'value'; value: T }>
  | Readonly<{ kind: 'failed' }>;

type FailureEvent = Extract<TerminalEvent, { kind: 'failure' }>;

export type StartGuiInput = {
  readonly cwd: t.PiCli.Cwd;
  readonly until?: AbortSignal;
  readonly source?: StartGuiEvidence;
  readonly deps?: Partial<StartGuiDependencies>;
};

type PreparedStartGui = Readonly<{
  root: t.StringDir;
  deps: StartGuiDependencies;
  authorityEvidence: ReturnType<typeof snapshotAuthorityEvidence>;
  recovery?: StartGuiRecoveryPolicy;
  state: ReturnType<typeof createBootState>;
  stateSource: ReturnType<typeof bootStateSource>;
  stopLife: t.Abortable;
  workLife: t.Abortable;
}>;

const NativeError = Error;
const apply = Reflect.apply;
const freeze = Object.freeze;
const getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;
const getPrototypeOf = Object.getPrototypeOf;
const isAbsolutePath = Fs.Path.Is.absolute;
const objectPrototype = Object.prototype;
const ownKeys = Reflect.ownKeys;
const START_INPUT_KEYS = ['cwd', 'until', 'source', 'deps'] as const;
const CWD_KEYS = ['invoked', 'root', 'git'] as const;
const DEPENDENCY_KEYS = [
  'materialize',
  'start',
  'startStatus',
  'ensureDir',
  'createRooted',
  'open',
  'bindKeyboard',
  'createScreen',
] as const;
const DEFAULT_SNAPSHOT_DEPENDENCIES = receiverlessDependencies(DEFAULT_DEPENDENCIES);
const RETAINED_OPEN_RESULTS = StartGuiIntrinsic.createSet<unknown>();

/**
 * Lazy GUI start leaf.
 *
 * Caller authority is copied into finite owned evidence before the asynchronous implementation is
 * entered, so the raw input container and its credential-bearing source cannot cross an await.
 */
export function start(input: StartGuiInput): Promise<void> {
  try {
    assertPromiseTransportReady();
    const snapshot = snapshotStartInput(input);
    const deps = snapshotDependencies(snapshot.deps);
    const sourceInput = snapshot.source === undefined ? START_GUI_SERVICE.source : snapshot.source;
    const authorityEvidence = snapshotAuthorityEvidence(sourceInput);
    const recovery = sourceInput === START_GUI_SERVICE.source
      ? START_GUI_SERVICE.recovery
      : undefined;
    const state = createBootState();
    const stateSource = bootStateSource(state);
    const stopLife = Rx.abortable(snapshot.until);
    const workLife = Rx.abortable();
    return startPrepared(freeze({
      root: snapshot.root,
      deps,
      authorityEvidence,
      ...(recovery ? { recovery } : {}),
      state,
      stateSource,
      stopLife,
      workLife,
    }));
  } catch (cause) {
    const rejected = createPromiseDeferred<void>();
    rejected.reject(ownedError(cause, 'start:gui startup failed.'));
    return rejected.promise;
  }
}

async function startPrepared(input: PreparedStartGui): Promise<void> {
  const { root, deps, authorityEvidence, recovery, state, stateSource, stopLife, workLife } = input;
  const displayRoot = authorityEvidence.kind === 'valid' &&
      authorityEvidence.authority.kind === 'development'
    ? authorityEvidence.authority.dir
    : undefined;
  const displayManifestUrl = authorityEvidence.kind === 'valid' &&
      authorityEvidence.authority.kind === 'release'
    ? authorityEvidence.authority.source.href
    : undefined;
  let status: StatusOwner;
  let statusInvoked = false;
  let statusAbsenceProved = false;
  let statusTransport: unknown;
  const statusInvocationEvidence = freeze({ kind: 'invoked-without-transport' as const });
  try {
    assertPromiseTransportReady();
    const invokeStatus: typeof deps.startStatus = (options) => {
      statusInvoked = true;
      const transport = deps.startStatus(options);
      statusTransport = transport;
      return transport;
    };
    const bootstrapTransport = startBootstrap(stateSource, invokeStatus);
    statusTransport = bootstrapTransport;
    const observation = observePromiseTransport<
      Awaited<ReturnType<StartGuiDependencies['startStatus']>>,
      Observed<StatusOwner>
    >(bootstrapTransport, {
      fulfilled(value) {
        const snapshot = snapshotStatusOwner(value);
        if (snapshot.kind === 'invalid') {
          if (snapshot.owner) {
            retainUnsupervisedStatus(snapshot.owner, 'start:gui.bootstrap-owner-invalid');
          } else retainUnobservableStatusOperation(value);
          return OBSERVED_FAILURE;
        }
        return freeze({ kind: 'value', value: snapshot.owner });
      },
      rejected() {
        statusAbsenceProved = true;
        return OBSERVED_FAILURE;
      },
    });
    if (observation.kind === 'invalid') throw createOwnedError(PROMISE_TRANSPORT_ERROR);
    const result = await awaitPromise(observation.promise);
    if (result.kind === 'failed') {
      if (!isPromiseTransportReady()) throw createOwnedError(PROMISE_TRANSPORT_ERROR);
      throw createOwnedError('start:gui bootstrap startup failed.');
    }
    status = result.value;
  } catch (cause) {
    disposeLife(workLife, 'start:gui.bootstrap-startup-failed');
    disposeLife(stopLife, 'start:gui.bootstrap-startup-failed');
    const primary = ownedError(cause, 'start:gui bootstrap startup failed.');
    if (statusInvoked && !statusAbsenceProved) {
      retainUnobservableStatusOperation(
        statusTransport === undefined ? statusInvocationEvidence : statusTransport,
      );
      throw finalError({ primary, cleanup: unresolvedStatusCleanup() });
    }
    throw primary;
  }

  let supervisor: Supervisor;
  try {
    assertPromiseTransportReady();
    supervisor = createSupervisor({ state, status, stopLife, workLife });
  } catch (cause) {
    disposeLife(workLife, 'start:gui.supervisor-startup-failed');
    disposeLife(stopLife, 'start:gui.supervisor-startup-failed');
    retainUnsupervisedStatus(status, 'start:gui.supervisor-startup-failed');
    throw finalError({
      primary: ownedError(cause, 'start:gui supervisor startup failed.'),
      cleanup: unresolvedStatusCleanup(),
    });
  }
  let primary: Error | undefined;
  let presentation: PresentationEvidence | undefined;
  let cleanup: CleanupEvidence | undefined;
  let bootResult: BootResult = EXTERNAL_STOP_RESULT;
  let controlsReady = false;
  let trustedStopRequested = false;
  let presentableFailureReleased = false;
  let redrawScreen = () => {};
  const requestTrustedStop = (source: 'back' | 'quit') => {
    trustedStopRequested = true;
    supervisor.requestStop(`start:gui.keyboard.${source}`);
  };
  const isFailureHeld = (event: FailureEvent) => controlsReady && retainsFailureForeground(event);
  const recordPresentableRelease = (event: FailureEvent) => {
    presentableFailureReleased = trustedStopRequested && isCliPresentableFailure(event);
  };

  try {
    // Acquire controls synchronously after the immediate pre-abort latch. Already-queued listener
    // observations may then fail the session at the first checkpoint without removing quit access.
    const keyboardAdmission = supervisor.admitWork(() => {
      try {
        return deps.bindKeyboard({
          exit: false,
          onKey: (event) => {
            if (Cli.Keyboard.Is.redraw(event)) redrawScreen();
            if (isBackKey(event)) requestTrustedStop('back');
          },
          onQuit: () => requestTrustedStop('quit'),
        });
      } catch {
        supervisor.recordUnobservableControl('keyboard');
        throw new NativeError('start:gui keyboard binding failed.');
      }
    });
    if (keyboardAdmission.kind === 'admitted') {
      const keyboard = keyboardAdmission.value;
      if (!keyboard) throw createOwnedError('start:gui keyboard unavailable.');
      supervisor.setKeyboard(keyboard);

      const screenAdmission = supervisor.admitWork(() => {
        try {
          return deps.createScreen({
            service: START_GUI_SERVICE.name,
            url: status.url,
            ...(displayRoot === undefined ? {} : { root: displayRoot }),
            ...(displayManifestUrl === undefined ? {} : { manifestUrl: displayManifestUrl }),
            ...(recovery === undefined ? {} : { recovery }),
            state: stateSource,
            keyboard: true,
            onFailure: supervisor.publishScreenFailure,
          });
        } catch {
          supervisor.recordUnobservableControl('screen');
          throw new NativeError('start:gui screen acquisition failed.');
        }
      });
      if (screenAdmission.kind === 'admitted') {
        const screen = supervisor.setScreen(screenAdmission.value);
        if (screen.kind === 'unavailable') {
          throw createOwnedError('start:gui screen unavailable.');
        }
        if (screen.kind === 'failed') {
          supervisor.publishScreenFailure(undefined);
        } else {
          redrawScreen = () => {
            if (supervisor.currentBlocker) return;
            try {
              screen.redraw();
            } catch (cause) {
              redrawScreen = () => {};
              supervisor.publishScreenFailure(cause);
            }
          };
          controlsReady = true;
          const openAdmission = await beginPromise(() =>
            admitAfterCheckpoint(supervisor, () => {
              const recordOpenFailure = () => {
                presentation ??= freeze({ kind: 'browser-open-failed', url: status.url });
                try {
                  screen.warnOpen();
                } catch (cause) {
                  supervisor.publishScreenFailure(cause);
                }
              };
              try {
                admitOpenResult(deps.open(root, status.url), recordOpenFailure);
              } catch {
                recordOpenFailure();
              }
            })
          );
          if (openAdmission.kind === 'blocked') bootResult = bootResultOf(openAdmission.event);
        }
      } else {
        bootResult = bootResultOf(screenAdmission.event);
      }
    } else {
      bootResult = bootResultOf(keyboardAdmission.event);
    }

    await beginPromise(() => supervisor.checkpoint());
    if (controlsReady && !supervisor.currentBlocker) {
      bootResult = await beginPromise(() =>
        runBoot({ root, authorityEvidence, state, supervisor, deps })
      );
    }

    const terminal: TerminalEvent = supervisor.currentTerminal ??
      await awaitPromise(supervisor.terminal);
    if (terminal.kind === 'failure') {
      primary = terminal.error;
      if (isFailureHeld(terminal)) {
        await awaitPromise(supervisor.foregroundReleased);
        recordPresentableRelease(terminal);
      }
    } else if (
      bootResult.kind === 'stop' && bootResult.source === 'external-cancellation' &&
      state.current.kind !== 'failed' && state.current.kind !== 'stopping'
    ) {
      state.set(cancelledBootState());
    }
  } catch (cause) {
    const failure = captureFailure(cause, controlsReady ? 'application-host' : 'controls');
    supervisor.publishFailure(failure.error, failure.state);
    const terminal = supervisor.currentTerminal ?? supervisor.currentBlocker ??
      (isPromiseTransportReady() ? await awaitPromise(supervisor.terminal) : undefined);
    if (terminal?.kind === 'failure') primary = terminal.error;
    else if (terminal === undefined) primary = failure.error;
    const canAwaitRelease = terminal?.kind === 'failure' && isPromiseTransportReady();
    if (canAwaitRelease && isFailureHeld(terminal)) {
      await awaitPromise(supervisor.foregroundReleased);
      recordPresentableRelease(terminal);
    }
  } finally {
    if (state.current.kind !== 'stopping') {
      try {
        state.set(Boot.stopping);
      } catch {
        // State observers cannot prevent owned resource cleanup.
      }
    }
    if (!isPromiseTransportReady()) {
      primary ??= createOwnedError(PROMISE_TRANSPORT_ERROR);
      cleanup = supervisor.closeInvalidTransport();
    } else {
      try {
        cleanup = await beginPromise(() => supervisor.close());
      } catch (cause) {
        primary ??= ownedError(cause, 'start:gui cleanup failed.');
        cleanup = supervisor.closeInvalidTransport();
      }
    }
  }

  const error = finalError({
    primary,
    cleanup,
    presentation,
    materialization: supervisor.materializationEvidence,
  });
  if (!error) return;
  if (presentableFailureReleased) markCliSettledFailure(error);
  throw error;
}

async function runBoot(input: {
  root: t.StringDir;
  authorityEvidence: ReturnType<typeof snapshotAuthorityEvidence>;
  state: ReturnType<typeof createBootState>;
  supervisor: Supervisor;
  deps: StartGuiDependencies;
}): Promise<BootResult> {
  assertPromiseTransportReady();
  let operation: FailureOperation = 'authority';
  try {
    const authorityAdmission = await beginPromise(() =>
      admitAfterCheckpoint(
        input.supervisor,
        () => input.authorityEvidence,
      )
    );
    if (authorityAdmission.kind === 'blocked') return bootResultOf(authorityAdmission.event);
    const authorityResult = authorityAdmission.value;
    if (authorityResult.kind === 'invalid') throw authorityResult.error;
    const authority = authorityResult.authority;

    let dir: t.StringAbsoluteDir;
    if (authority.kind === 'release') {
      operation = 'release-owner';
      const ownerAdmission = await beginPromise(() =>
        admitAfterCheckpoint(
          input.supervisor,
          () =>
            observeOperation(
              () =>
                prepareReleaseOwner({
                  root: input.root,
                  deps: input.deps,
                  until: input.supervisor.signal,
                }),
              operation,
              input.supervisor,
              (owner) => {
                input.supervisor.setLease(owner.lease);
                return owner;
              },
            ),
        )
      );
      if (ownerAdmission.kind === 'blocked') return bootResultOf(ownerAdmission.event);

      const ownerResult = await awaitPromise(ownerAdmission.value);
      if (ownerResult.kind === 'failed') return resultAfterObservedFailure(input.supervisor);

      const materializeAdmission = await beginPromise(() =>
        admitAfterCheckpoint(
          input.supervisor,
          () =>
            observeMaterialization({
              invoke: () =>
                materialize({
                  owner: ownerResult.value,
                  source: authority.source,
                  integrity: authority.integrity,
                  deps: input.deps,
                  until: input.supervisor.signal,
                }),
              expected: authority.expectedPkg,
              diagnostics: authority.diagnostics,
              supervisor: input.supervisor,
              operation,
            }),
        )
      );
      if (materializeAdmission.kind === 'blocked') {
        return bootResultOf(materializeAdmission.event);
      }

      const materialized = await awaitPromise(materializeAdmission.value);
      if (materialized.kind === 'failed') return resultAfterObservedFailure(input.supervisor);
      dir = materialized.value.dir;
    } else {
      dir = authority.dir;
    }
    const directoryHref = captureFileHref(dir);

    operation = 'application-host';
    const startingAdmission = await beginPromise(() =>
      admitAfterCheckpoint(
        input.supervisor,
        () => input.state.set(Boot.startingAppHost),
      )
    );
    if (startingAdmission.kind === 'blocked') return bootResultOf(startingAdmission.event);

    const applicationAdmission = await beginPromise(() =>
      admitAfterCheckpoint(
        input.supervisor,
        () =>
          observeOperation(
            () =>
              input.deps.start({
                dir,
                integrity: authority.integrity,
                limits: LIMITS,
                hostname: '127.0.0.1',
                port: 0,
                browserPolicy: VERIFIED_LOOPBACK_BROWSER_POLICY,
                silent: true,
                until: input.supervisor.signal,
              }),
            operation,
            input.supervisor,
            (started) =>
              input.supervisor.setApplication(
                started,
                freeze({
                  integrity: authority.integrity,
                  expectedPkg: authority.expectedPkg,
                  ...(authority.kind === 'release' ? { diagnostics: authority.diagnostics } : {}),
                }),
              ),
            'application-host',
          ),
      )
    );
    if (applicationAdmission.kind === 'blocked') {
      return bootResultOf(applicationAdmission.event);
    }

    const application = await awaitPromise(applicationAdmission.value);
    if (application.kind === 'failed') return resultAfterObservedFailure(input.supervisor);

    const readyState = Boot.ready(
      application.value.origin,
      application.value.digest,
      directoryHref,
    );
    const readyAdmission = await beginPromise(() =>
      admitAfterCheckpoint(input.supervisor, () => input.state.set(readyState))
    );
    if (readyAdmission.kind === 'blocked') return bootResultOf(readyAdmission.event);

    await beginPromise(() => input.supervisor.checkpoint());
    const afterReady = input.supervisor.currentBlocker;
    return afterReady ? bootResultOf(afterReady) : READY_RESULT;
  } catch (cause) {
    const failure = captureFailure(cause, operation);
    input.supervisor.publishFailure(failure.error, failure.state);
    return resultAfterObservedFailure(input.supervisor);
  }
}

async function admitAfterCheckpoint<T>(
  supervisor: Supervisor,
  action: () => T,
): Promise<WorkAdmission<T>> {
  assertPromiseTransportReady();
  await beginPromise(() => supervisor.checkpoint());
  return supervisor.admitWork(action);
}

function observeOperation<T, R>(
  invoke: () => Promise<T>,
  operation: FailureOperation,
  supervisor: Supervisor,
  admit: (value: T) => R,
  unobservableResource?: 'application-host',
): Promise<Observed<R>> {
  let invoked = false;
  let transport: unknown;
  const invocationEvidence = freeze({ kind: 'invoked-without-transport' as const });
  try {
    assertPromiseTransportReady();
    invoked = true;
    transport = invoke();
    const observation = observePromiseTransport<T, Observed<R>>(transport, {
      fulfilled(value) {
        const reaction = supervisor.beginObservedReaction();
        try {
          const admitted = admit(value);
          if (!isPromiseTransportReady()) {
            publishPromiseTransportFailure(supervisor, operation, reaction);
            return OBSERVED_FAILURE;
          }
          return freeze({ kind: 'value', value: admitted });
        } catch (cause) {
          if (!isPromiseTransportReady()) {
            publishPromiseTransportFailure(supervisor, operation, reaction);
          } else {
            const failure = captureFailure(cause, operation);
            supervisor.publishObservedFailure(reaction, failure.error, failure.state);
          }
          return OBSERVED_FAILURE;
        }
      },
      rejected(cause) {
        const reaction = supervisor.beginObservedReaction();
        if (!isPromiseTransportReady()) {
          publishPromiseTransportFailure(supervisor, operation, reaction);
          return OBSERVED_FAILURE;
        }
        const failure = captureFailure(cause, operation);
        supervisor.publishObservedFailure(reaction, failure.error, failure.state);
        return OBSERVED_FAILURE;
      },
    });
    if (observation.kind === 'observed') return observation.promise;
    if (unobservableResource) {
      supervisor.recordUnobservableOperation(
        unobservableResource,
        transport === undefined ? invocationEvidence : transport,
      );
    }
    const failure = captureFailure(undefined, operation);
    supervisor.publishFailure(failure.error, failure.state);
  } catch (cause) {
    if (invoked && unobservableResource) {
      supervisor.recordUnobservableOperation(
        unobservableResource,
        transport === undefined ? invocationEvidence : transport,
      );
    }
    const failure = captureFailure(cause, operation);
    supervisor.publishFailure(failure.error, failure.state);
  }
  return OBSERVED_FAILURE_PROMISE;
}

function observeMaterialization(input: {
  invoke: () => Promise<unknown>;
  expected: Readonly<t.Pkg>;
  diagnostics: Parameters<typeof admitGenerationPkg>[0]['diagnostics'];
  supervisor: Supervisor;
  operation: FailureOperation;
}): Promise<Observed<AdmittedGeneration>> {
  let invoked = false;
  let transport: unknown;
  const invocationEvidence = freeze({ kind: 'invoked-without-transport' as const });
  try {
    assertPromiseTransportReady();
    invoked = true;
    transport = input.invoke();
    const observation = observePromiseTransport<unknown, Observed<AdmittedGeneration>>(
      transport,
      {
        fulfilled(result) {
          const reaction = input.supervisor.beginObservedReaction();
          try {
            const settlement = admitMaterialization({
              generation: result,
              diagnostics: input.diagnostics,
            });
            if (settlement.kind === 'failed') {
              if (!isPromiseTransportReady()) {
                input.supervisor.recordMaterialization(settlement);
                publishPromiseTransportFailure(input.supervisor, input.operation, reaction);
                return OBSERVED_FAILURE;
              }
              const failure = captureFailure(materializationError(settlement), input.operation);
              const won = input.supervisor.publishObservedFailure(
                reaction,
                failure.error,
                failure.state,
              );
              if (!won) input.supervisor.recordMaterialization(settlement);
              return OBSERVED_FAILURE;
            }

            // Retain independently admitted cleanup truth before identity can refuse startup.
            input.supervisor.recordMaterialization(settlement);
            if (!isPromiseTransportReady()) {
              publishPromiseTransportFailure(input.supervisor, input.operation, reaction);
              return OBSERVED_FAILURE;
            }
            const admitted = admitGenerationPkg({
              expected: input.expected,
              generation: settlement,
              diagnostics: input.diagnostics,
            });
            return freeze({ kind: 'value', value: admitted });
          } catch (cause) {
            if (!isPromiseTransportReady()) {
              publishPromiseTransportFailure(input.supervisor, input.operation, reaction);
            } else {
              const failure = captureFailure(cause, input.operation);
              input.supervisor.publishObservedFailure(
                reaction,
                failure.error,
                failure.state,
              );
            }
            return OBSERVED_FAILURE;
          }
        },
        rejected(cause) {
          const reaction = input.supervisor.beginObservedReaction();
          if (!isPromiseTransportReady()) {
            publishPromiseTransportFailure(input.supervisor, input.operation, reaction);
            return OBSERVED_FAILURE;
          }
          const failure = captureFailure(cause, input.operation);
          input.supervisor.publishObservedFailure(reaction, failure.error, failure.state);
          return OBSERVED_FAILURE;
        },
      },
    );
    if (observation.kind === 'observed') return observation.promise;
    input.supervisor.recordUnobservableOperation(
      'materialization',
      transport === undefined ? invocationEvidence : transport,
    );
    const failure = captureFailure(undefined, input.operation);
    input.supervisor.publishFailure(failure.error, failure.state);
  } catch (cause) {
    if (invoked) {
      input.supervisor.recordUnobservableOperation(
        'materialization',
        transport === undefined ? invocationEvidence : transport,
      );
    }
    const failure = captureFailure(cause, input.operation);
    input.supervisor.publishFailure(failure.error, failure.state);
  }
  return OBSERVED_FAILURE_PROMISE;
}

function beginPromise<T>(invoke: () => Promise<T>): Promise<T> {
  assertPromiseTransportReady();
  const promise = invoke();
  assertPromiseTransportReady();
  return promise;
}

function awaitPromise<T>(promise: Promise<T>): Promise<T> {
  assertPromiseTransportReady();
  return promise;
}

function publishPromiseTransportFailure(
  supervisor: Supervisor,
  operation: FailureOperation,
  reaction: ReturnType<Supervisor['beginObservedReaction']>,
): void {
  supervisor.publishObservedFailure(
    reaction,
    createOwnedError(PROMISE_TRANSPORT_ERROR),
    captureFailure(undefined, operation).state,
  );
}

type StartInputSnapshot = Readonly<{
  root: t.StringDir;
  until?: AbortSignal;
  source?: unknown;
  deps?: unknown;
}>;

type OptionalData =
  | Readonly<{ present: true; value: unknown }>
  | Readonly<{ present: false }>;

function snapshotStartInput(input: unknown): StartInputSnapshot {
  try {
    if (!isDirectInputObject(input)) throw createOwnedError('start:gui input invalid.');
    const keys = ownKeys(input);
    if (keys.length === 0 || keys.length > START_INPUT_KEYS.length) {
      throw createOwnedError('start:gui input invalid.');
    }
    for (let index = 0; index < keys.length; index += 1) {
      const key = keys[index];
      if (
        !Is.string(key) || !StartGuiIntrinsic.arrayIncludes(START_INPUT_KEYS, key) ||
        !ownInputData(input, key).present
      ) throw createOwnedError('start:gui input invalid.');
    }

    const cwd = ownInputData(input, 'cwd');
    if (!cwd.present) throw createOwnedError('start:gui input invalid.');
    const root = snapshotCwdRoot(cwd.value);
    const untilInput = optionalInputValue(input, 'until');
    const until = untilInput.present ? snapshotCapturedAbortSignal(untilInput.value) : undefined;
    if (untilInput.present && !until) throw createOwnedError('start:gui input invalid.');
    const source = optionalInputValue(input, 'source');
    const deps = optionalInputValue(input, 'deps');
    return freeze({
      root,
      ...(until ? { until } : {}),
      ...(source.present ? { source: source.value } : {}),
      ...(deps.present ? { deps: deps.value } : {}),
    });
  } catch (cause) {
    throw ownedError(cause, 'start:gui input invalid.');
  }
}

function snapshotCwdRoot(input: unknown): t.StringDir {
  if (!isDirectInputObject(input)) throw createOwnedError('start:gui input invalid.');
  const keys = ownKeys(input);
  if (keys.length < 2 || keys.length > CWD_KEYS.length) {
    throw createOwnedError('start:gui input invalid.');
  }
  for (let index = 0; index < keys.length; index += 1) {
    const key = keys[index];
    if (
      !Is.string(key) || !StartGuiIntrinsic.arrayIncludes(CWD_KEYS, key) ||
      !ownInputData(input, key).present
    ) throw createOwnedError('start:gui input invalid.');
  }

  const invoked = ownInputData(input, 'invoked');
  const root = ownInputData(input, 'root');
  const git = ownInputData(input, 'git');
  if (!invoked.present || !isAdmittedPath(invoked.value)) {
    throw createOwnedError('start:gui input invalid.');
  }
  if (root.present && !isAdmittedPath(root.value)) {
    throw createOwnedError('start:gui input invalid.');
  }
  if (git.present && !isAdmittedPath(git.value)) {
    throw createOwnedError('start:gui input invalid.');
  }
  if (!root.present && !git.present) throw createOwnedError('start:gui input invalid.');
  if (root.present && git.present && root.value !== git.value) {
    throw createOwnedError('start:gui input invalid.');
  }
  if (root.present) return root.value as t.StringDir;
  if (git.present) return git.value as t.StringDir;
  throw createOwnedError('start:gui input invalid.');
}

function optionalInputValue(input: object, key: PropertyKey): OptionalData {
  const value = ownInputData(input, key);
  if (value.present && value.value === undefined) {
    throw createOwnedError('start:gui input invalid.');
  }
  return value;
}

function ownInputData(input: object, key: PropertyKey): OptionalData {
  const descriptor = getOwnPropertyDescriptor(input, key);
  if (!descriptor) return freeze({ present: false as const });
  return descriptor.enumerable === true && 'value' in descriptor
    ? freeze({ present: true as const, value: descriptor.value })
    : freeze({ present: false as const });
}

function isDirectInputObject(input: unknown): input is object {
  if (!Is.object(input) || Is.Native.proxy(input)) return false;
  try {
    return getPrototypeOf(input) === objectPrototype;
  } catch {
    return false;
  }
}

function isAdmittedPath(input: unknown): input is t.StringDir {
  return Is.string(input) && input.length > 0 && input.length <= 4_096 &&
    !StartGuiIntrinsic.stringIncludes(input, '\0') &&
    apply(isAbsolutePath, undefined, [input]) === true;
}

function snapshotDependencies(input: unknown): StartGuiDependencies {
  if (input === undefined) return DEFAULT_SNAPSHOT_DEPENDENCIES;
  try {
    if (!isDirectInputObject(input)) {
      throw createOwnedError('start:gui dependencies invalid.');
    }
    const keys = ownKeys(input);
    if (keys.length > DEPENDENCY_KEYS.length) {
      throw createOwnedError('start:gui dependencies invalid.');
    }
    for (let index = 0; index < keys.length; index += 1) {
      const key = keys[index];
      if (
        !Is.string(key) || !StartGuiIntrinsic.arrayIncludes(DEPENDENCY_KEYS, key) ||
        !ownInputData(input, key).present
      ) throw createOwnedError('start:gui dependencies invalid.');
    }
    const candidate: StartGuiDependencies = {
      materialize: dependency(input, 'materialize'),
      start: dependency(input, 'start'),
      startStatus: dependency(input, 'startStatus'),
      ensureDir: dependency(input, 'ensureDir'),
      createRooted: dependency(input, 'createRooted'),
      open: dependency(input, 'open'),
      bindKeyboard: dependency(input, 'bindKeyboard'),
      createScreen: dependency(input, 'createScreen'),
    };
    return receiverlessDependencies(candidate);
  } catch (cause) {
    throw ownedError(cause, 'start:gui dependencies invalid.');
  }
}

function dependency<K extends keyof StartGuiDependencies>(
  input: object,
  key: K,
): StartGuiDependencies[K] {
  const descriptor = getOwnPropertyDescriptor(input, key);
  if (!descriptor) return DEFAULT_DEPENDENCIES[key];
  if (descriptor.enumerable !== true || !('value' in descriptor)) {
    throw createOwnedError('start:gui dependencies invalid.');
  }
  const value = descriptor.value;
  if (!Is.func(value) || Is.Native.proxy(value)) {
    throw createOwnedError('start:gui dependencies invalid.');
  }
  return value as StartGuiDependencies[K];
}

function admitOpenResult(input: unknown, onFailure: () => void): void {
  if (input === undefined) return;
  try {
    const observation = observePromiseTransport<unknown, void>(input, {
      fulfilled() {},
      rejected() {
        onFailure();
      },
    });
    if (observation.kind === 'observed') return;
  } catch {
    // Unobservable opener work is retained and reduced to bounded presentation evidence below.
  }
  StartGuiIntrinsic.setAdd(RETAINED_OPEN_RESULTS, input);
  onFailure();
}

function receiverlessDependencies(input: StartGuiDependencies): StartGuiDependencies {
  const materialize = input.materialize;
  const start = input.start;
  const startStatus = input.startStatus;
  const ensureDir = input.ensureDir;
  const createRooted = input.createRooted;
  const open = input.open;
  const bindKeyboard = input.bindKeyboard;
  const createScreen = input.createScreen;
  return freeze({
    materialize(...args) {
      return apply(materialize, undefined, args);
    },
    start(...args) {
      return apply(start, undefined, args);
    },
    startStatus(...args) {
      return apply(startStatus, undefined, args);
    },
    ensureDir(...args) {
      return apply(ensureDir, undefined, args);
    },
    createRooted(...args) {
      return apply(createRooted, undefined, args);
    },
    open(...args) {
      return apply(open, undefined, args);
    },
    bindKeyboard(...args) {
      return apply(bindKeyboard, undefined, args);
    },
    createScreen(...args) {
      return apply(createScreen, undefined, args);
    },
  });
}

const READY_RESULT: BootResult = freeze({ kind: 'ready' });
const FAILED_RESULT: BootResult = freeze({ kind: 'failed' });
const EXTERNAL_STOP_RESULT: BootResult = freeze({
  kind: 'stop',
  source: 'external-cancellation',
});
const TRUSTED_STOP_RESULT: BootResult = freeze({
  kind: 'stop',
  source: 'trusted-control',
});
const OBSERVED_FAILURE: Observed<never> = freeze({ kind: 'failed' });
const OBSERVED_FAILURE_PROMISE = resolvedPromise(OBSERVED_FAILURE);

function assertPromiseTransportReady(): void {
  if (!isPromiseTransportReady()) throw createOwnedError(PROMISE_TRANSPORT_ERROR);
}

function resultAfterObservedFailure(supervisor: Supervisor): BootResult {
  const terminal = supervisor.currentBlocker;
  return terminal ? bootResultOf(terminal) : FAILED_RESULT;
}

function bootResultOf(event: TerminalEvent): BootResult {
  if (event.kind === 'failure') return FAILED_RESULT;
  return event.source === 'external-cancellation' ? EXTERNAL_STOP_RESULT : TRUSTED_STOP_RESULT;
}

function retainsFailureForeground(event: FailureEvent): boolean {
  const evidence = event.state.safeEvidence;
  return !(evidence.kind === 'local' && evidence.operation === 'controls');
}

function isCliPresentableFailure(event: FailureEvent): boolean {
  const evidence = event.state.safeEvidence;
  if (evidence.kind !== 'local') return true;
  return evidence.operation !== 'controls' && evidence.operation !== 'screen';
}

function unresolvedStatusCleanup(): CleanupEvidence {
  return freeze({
    kind: 'cleanup-failed',
    issues: freeze([
      freeze({ resource: 'status-listener', state: 'unresolved' }),
    ]),
  });
}

function disposeLife(life: t.Abortable, reason: string): void {
  try {
    life.dispose(reason);
  } catch {
    // Startup failure still owns its package-controlled terminal error.
  }
}

function isBackKey(event: KeyboardEvent): boolean {
  return event.key === 'left' && event.ctrlKey && !event.altKey && !event.metaKey &&
    !event.shiftKey;
}
