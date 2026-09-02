import { Cli, Rx, StartGuiIntrinsic, type t } from '../common.ts';

import { type AuthoritySnapshot, snapshotAuthorityEvidence } from '../u.authority.ts';
import { startBootstrap } from '../u.bootstrap.ts';
import type { StartGuiDependencies } from '../u.deps.ts';
import { createOwnedError, ownedError } from '../u.error.ts';
import { cancelledBootState, captureFailure } from '../u.failure.ts';
import {
  type CleanupEvidence,
  createSupervisor,
  finalError,
  type PresentationEvidence,
  retainUnobservableStatusOperation,
  retainUnsupervisedStatus,
  snapshotStatusOwner,
  type StatusOwner,
  type Supervisor,
  type TerminalEvent,
} from '../u.lifecycle/mod.ts';
import {
  createPromiseDeferred,
  isPromiseTransportReady,
  observePromiseTransport,
  PROMISE_TRANSPORT_ERROR,
} from '../u.promise.ts';
import { Boot, bootStateSource, createBootState } from '../u.state.ts';
import { START_GUI_SERVICE } from '../../u/u.start.gui.service.ts';
import {
  allowsBack,
  markCliSettledFailure,
  type StartGuiCompletion,
  startGuiCompletion,
  type StartGuiCompletionKind,
  type StartGuiControl,
} from '../../u/u.start.gui.settlement.ts';
import type { BootResult, Observed, PreparedStartGui, StartGuiInput } from './t.ts';
import { runBoot } from './u.boot.ts';
import { snapshotDependencies, snapshotStartInput } from './u.input.ts';
import {
  admitOpenResult,
  assertPromiseTransportReady,
  awaitPromise,
  beginAdmission,
  beginCheckpoint,
  beginPromise,
  bootResultOf,
  EXTERNAL_STOP_RESULT,
  OBSERVED_FAILURE,
} from './u.operation.ts';

type FailureEvent = Extract<TerminalEvent, { kind: 'failure' }>;
type StatusCandidate = Awaited<ReturnType<StartGuiDependencies['startStatus']>>;
type ScreenDisplayAuthority = Readonly<{
  root?: t.StringDir;
  manifestUrl?: t.StringUrl;
}>;
type ScreenOwner = ReturnType<Supervisor['setScreen']>;
type ControlAcquisition =
  | Readonly<{ kind: 'ready'; screen: ScreenOwner }>
  | Readonly<{ kind: 'failed' }>
  | Readonly<{ kind: 'blocked'; event: TerminalEvent }>;

const EMPTY_SCREEN_AUTHORITY: ScreenDisplayAuthority = StartGuiIntrinsic.freeze({});
const FAILED_CONTROL_ACQUISITION: ControlAcquisition = StartGuiIntrinsic.freeze({
  kind: 'failed',
});

/**
 * Start one verified GUI session.
 *
 * Caller authority is copied into finite owned evidence before asynchronous work begins, so the raw
 * input container and its credential-bearing source never cross an await. A successful promise
 * resolves with a package-owned completion only after foreground release and owned cleanup settle.
 */
export function start(input: StartGuiInput): Promise<StartGuiCompletion> {
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
    return startPrepared(StartGuiIntrinsic.freeze({
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
    const rejected = createPromiseDeferred<StartGuiCompletion>();
    rejected.reject(ownedError(cause, 'start:gui startup failed.'));
    return rejected.promise;
  }
}

async function startPrepared(input: PreparedStartGui): Promise<StartGuiCompletion> {
  const { root, deps, authorityEvidence, recovery, state, stateSource, stopLife, workLife } = input;
  const screenAuthority = screenDisplayAuthority(authorityEvidence);
  let status: StatusOwner;
  let statusInvoked = false;
  let statusAbsenceProved = false;
  let statusTransport: unknown;
  const statusInvocationEvidence = StartGuiIntrinsic.freeze({
    kind: 'invoked-without-transport' as const,
  });
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
    const admitStatus = (value: StatusCandidate): Observed<StatusOwner> => {
      const snapshot = snapshotStatusOwner(value);
      if (snapshot.kind === 'invalid') {
        if (snapshot.owner) {
          retainUnsupervisedStatus(snapshot.owner, 'start:gui.bootstrap-owner-invalid');
        } else retainUnobservableStatusOperation(value);
        return OBSERVED_FAILURE;
      }
      return StartGuiIntrinsic.freeze({ kind: 'value', value: snapshot.owner });
    };
    const refuseStatus = (): Observed<never> => {
      statusAbsenceProved = true;
      return OBSERVED_FAILURE;
    };
    const observation = observePromiseTransport<StatusCandidate, Observed<StatusOwner>>(
      bootstrapTransport,
      { fulfilled: admitStatus, rejected: refuseStatus },
    );
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
  let completionKind: StartGuiCompletionKind | undefined;
  let controlsReady = false;
  let trustedControl: StartGuiControl | undefined;
  let presentableFailureReleased = false;
  let redrawScreen = () => {};
  const requestTrustedStop = (source: StartGuiControl) => {
    if (trustedControl !== undefined) return;
    if (supervisor.requestStop(`start:gui.keyboard.${source}`)) trustedControl = source;
  };
  const isFailureHeld = (event: FailureEvent) => controlsReady && retainsFailureForeground(event);
  const recordPresentableRelease = (event: FailureEvent) => {
    presentableFailureReleased = trustedControl !== undefined && isCliPresentableFailure(event);
  };
  const bindKeyboard = () => {
    try {
      return deps.bindKeyboard({
        exit: false,
        onKey: (event) => {
          if (Cli.Keyboard.Is.redraw(event)) redrawScreen();
          if (Cli.Keyboard.Is.back(event) && allowsBack(state.current)) {
            requestTrustedStop('back');
            return 'stop';
          }
        },
        onQuit: () => requestTrustedStop('quit'),
      });
    } catch {
      supervisor.recordUnobservableControl('keyboard');
      throw StartGuiIntrinsic.createError('start:gui keyboard binding failed.');
    }
  };
  const createScreen = () => {
    try {
      return deps.createScreen({
        service: START_GUI_SERVICE.name,
        url: status.url,
        ...screenAuthority,
        ...(recovery === undefined ? {} : { recovery }),
        state: stateSource,
        keyboard: true,
        onFailure: supervisor.publishScreenFailure,
      });
    } catch {
      supervisor.recordUnobservableControl('screen');
      throw StartGuiIntrinsic.createError('start:gui screen acquisition failed.');
    }
  };

  try {
    // Acquire controls synchronously after the immediate pre-abort latch. Already-queued listener
    // observations may then fail the session at the first checkpoint without removing quit access.
    const controls = acquireControls(supervisor, bindKeyboard, createScreen);
    if (controls.kind === 'blocked') {
      bootResult = bootResultOf(controls.event);
    } else if (controls.kind === 'ready') {
      const { screen } = controls;
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
      const recordOpenFailure = () => {
        presentation ??= StartGuiIntrinsic.freeze({
          kind: 'browser-open-failed',
          url: status.url,
        });
        try {
          screen.warnOpen();
        } catch (cause) {
          supervisor.publishScreenFailure(cause);
        }
      };
      const openBrowser = () => {
        try {
          admitOpenResult(deps.open(root, status.url), recordOpenFailure);
        } catch {
          recordOpenFailure();
        }
      };
      const openAdmission = await beginAdmission(supervisor, openBrowser);
      if (openAdmission.kind === 'blocked') bootResult = bootResultOf(openAdmission.event);
    }

    await beginCheckpoint(supervisor);
    if (controlsReady && !supervisor.currentBlocker) {
      const boot = () => runBoot({ root, authorityEvidence, state, supervisor, deps });
      bootResult = await beginPromise(boot);
    }

    const terminal: TerminalEvent = supervisor.currentTerminal ??
      await awaitPromise(supervisor.terminal);
    if (terminal.kind === 'failure') {
      primary = terminal.error;
      if (isFailureHeld(terminal)) {
        await awaitPromise(supervisor.foregroundReleased);
        recordPresentableRelease(terminal);
      }
    } else if (terminal.source === 'external-cancellation') {
      completionKind = 'external-cancellation';
      if (
        bootResult.kind === 'stop' && bootResult.source === 'external-cancellation' &&
        state.current.kind !== 'failed' && state.current.kind !== 'stopping'
      ) {
        state.set(cancelledBootState());
      }
    } else if (trustedControl !== undefined) {
      completionKind = trustedControl;
    } else {
      primary = createOwnedError('start:gui trusted completion unavailable.');
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
        const close = () => supervisor.close();
        cleanup = await beginPromise(close);
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
  if (!error) {
    if (completionKind === undefined) {
      throw createOwnedError('start:gui completion unavailable.');
    }
    return startGuiCompletion(completionKind);
  }
  if (presentableFailureReleased) markCliSettledFailure(error);
  throw error;
}

function acquireControls(
  supervisor: Supervisor,
  bindKeyboard: () => ReturnType<StartGuiDependencies['bindKeyboard']>,
  createScreen: () => ReturnType<StartGuiDependencies['createScreen']>,
): ControlAcquisition {
  const keyboardAdmission = supervisor.admitWork(bindKeyboard);
  if (keyboardAdmission.kind === 'blocked') {
    return StartGuiIntrinsic.freeze({ kind: 'blocked', event: keyboardAdmission.event });
  }
  const keyboard = keyboardAdmission.value;
  if (!keyboard) throw createOwnedError('start:gui keyboard unavailable.');
  supervisor.setKeyboard(keyboard);

  const screenAdmission = supervisor.admitWork(createScreen);
  if (screenAdmission.kind === 'blocked') {
    return StartGuiIntrinsic.freeze({ kind: 'blocked', event: screenAdmission.event });
  }
  const screen = supervisor.setScreen(screenAdmission.value);
  if (screen.kind === 'unavailable') throw createOwnedError('start:gui screen unavailable.');
  if (screen.kind === 'failed') {
    supervisor.publishScreenFailure(undefined);
    return FAILED_CONTROL_ACQUISITION;
  }
  return StartGuiIntrinsic.freeze({ kind: 'ready', screen });
}

function screenDisplayAuthority(evidence: AuthoritySnapshot): ScreenDisplayAuthority {
  if (evidence.kind === 'invalid') return EMPTY_SCREEN_AUTHORITY;
  const authority = evidence.authority;
  return authority.kind === 'development'
    ? StartGuiIntrinsic.freeze({ root: authority.dir })
    : StartGuiIntrinsic.freeze({ manifestUrl: authority.source.href });
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
  return StartGuiIntrinsic.freeze({
    kind: 'cleanup-failed',
    issues: StartGuiIntrinsic.freeze([
      StartGuiIntrinsic.freeze({ resource: 'status-listener', state: 'unresolved' }),
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
