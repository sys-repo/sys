import { Cli, Is, Schedule, type t } from '../common.ts';
import { runtimeRoot } from '../../../m.cli/u.runtime.ts';

import { type AuthoritySnapshot, snapshotAuthorityEvidence } from '../u.authority.ts';
import { startBootstrap } from '../u.bootstrap.ts';
import { DEFAULT_DEPENDENCIES, type StartGuiDependencies } from '../u.deps.ts';
import { createOwnedError, ownedError } from '../u.error.ts';
import {
  cancelledBootState,
  type CapturedFailure,
  captureFailure,
  listenerFailure,
} from '../u.failure.ts';
import {
  type CleanupEvidence,
  cleanupEvidence,
  type CleanupIssue,
  finalError,
  type PresentationEvidence,
} from '../u.final.ts';
import { Boot, bootStateSource, createBootState } from '../u.state.ts';
import { START_GUI_SERVICE } from '../../u/u.start.gui.service.ts';
import {
  allowsBack,
  markCliSettledFailure,
  type StartGuiCompletion,
  startGuiCompletion,
  type StartGuiCompletionKind,
} from '../../u/u.start.gui.settlement.ts';
import { type BootResources, runBoot } from './u.boot.ts';
import type { StartGuiInput } from './t.ts';

type TerminalEvent =
  | Readonly<{ kind: 'failure'; failure: CapturedFailure }>
  | Readonly<{ kind: 'stop'; completion: StartGuiCompletionKind }>;
type ObservedReaction = Readonly<{ pending: TerminalEvent | undefined }>;

type SessionResources = BootResources & {
  status?: t.BootstrapStatus.Started;
  keyboard?: t.Cli.Keyboard.Bind.Handle;
  screen?: ReturnType<StartGuiDependencies['createScreen']>;
};

/** Start one Driver Pi GUI session over package-owned Server and CLI lifecycles. */
export async function start(input: StartGuiInput): Promise<StartGuiCompletion> {
  const root = runtimeRoot(input.cwd, 'start:gui');
  const deps = Object.freeze({ ...DEFAULT_DEPENDENCIES, ...input.deps });
  const source = input.source ?? START_GUI_SERVICE.source;
  const authorityEvidence = snapshotAuthorityEvidence(source);
  const recovery = source === START_GUI_SERVICE.source ? START_GUI_SERVICE.recovery : undefined;
  const state = createBootState();
  const stateSource = bootStateSource(state);
  const work = new AbortController();
  const resources: SessionResources = {};
  const terminal = Promise.withResolvers<TerminalEvent>();
  const foreground = Promise.withResolvers<void>();
  let current: TerminalEvent | undefined;
  let pending: TerminalEvent | undefined;
  let stopRequested = false;
  let foregroundReleased = false;
  let trustedDismissal = false;
  let presentation: PresentationEvidence | undefined;
  let primary: Error | undefined;
  let completion: StartGuiCompletionKind | undefined;
  let controlsReady = false;
  let cliSettledFailure = false;
  let closing = false;
  let removeExternalAbort = () => {};
  let redraw = () => {};

  const releaseForeground = () => {
    if (foregroundReleased) return;
    foregroundReleased = true;
    foreground.resolve();
  };
  const abortWork = (reason: string) => {
    if (!work.signal.aborted) work.abort(reason);
  };
  const blocker = () => current ?? pending;
  const abortTerminalWork = (event: TerminalEvent) => {
    abortWork(
      event.kind === 'failure'
        ? 'start:gui.failure'
        : event.completion === 'external-cancellation'
        ? 'start:gui.external-cancellation'
        : 'start:gui.trusted-control',
    );
  };
  const commitTerminal = (event: TerminalEvent): boolean => {
    if (current) return false;
    current = event;
    pending = undefined;
    if (event.kind === 'failure') {
      try {
        state.set(event.failure.state);
      } catch {
        // The first failure still owns terminal settlement.
      }
    }
    abortTerminalWork(event);
    terminal.resolve(event);
    return true;
  };
  const queueTerminal = (event: TerminalEvent): boolean => {
    if (blocker()) return false;
    pending = event;
    try {
      Schedule.micro(() => {
        if (!current && pending === event) commitTerminal(event);
      });
    } catch {
      commitTerminal(event);
    }
    // Reserve the candidate before abort delivery can queue later lower-owner reactions.
    abortTerminalWork(event);
    return true;
  };
  const publish = (failure: CapturedFailure): boolean =>
    queueTerminal(Object.freeze({ kind: 'failure', failure }));
  const beginObservedReaction = (): ObservedReaction => Object.freeze({ pending });
  const publishObserved = (
    reaction: ObservedReaction,
    failure: CapturedFailure,
  ): boolean => {
    if (current || pending !== reaction.pending) return false;
    // A candidate already present when this direct reaction began was queued later and may be
    // displaced. A different candidate created reentrantly inside the reaction keeps precedence.
    pending = undefined;
    return commitTerminal(Object.freeze({ kind: 'failure', failure }));
  };
  const fail = (cause: unknown, operation: Parameters<typeof captureFailure>[1]) =>
    publish(captureFailure(cause, operation));
  const failObserved = (
    reaction: ObservedReaction,
    cause: unknown,
    operation: Parameters<typeof captureFailure>[1],
  ) => publishObserved(reaction, captureFailure(cause, operation));
  const requestStop = (next: StartGuiCompletionKind) => {
    if (stopRequested) return false;
    stopRequested = true;
    trustedDismissal = next !== 'external-cancellation';
    releaseForeground();
    if (!blocker()) queueTerminal(Object.freeze({ kind: 'stop', completion: next }));
    return true;
  };

  try {
    try {
      resources.status = await startBootstrap(stateSource, deps.startStatus);
    } catch (cause) {
      throw ownedError(cause, 'start:gui bootstrap startup failed.');
    }

    const statusSettled = () => {
      const reaction = beginObservedReaction();
      if (!closing) publishObserved(reaction, listenerFailure('status-listener'));
    };
    void resources.status.finished.then(statusSettled, statusSettled);
    removeExternalAbort = observeExternalAbort(input.until, () => {
      requestStop('external-cancellation');
    });
    await Schedule.micro();

    if (!blocker()) {
      try {
        resources.keyboard = deps.bindKeyboard({
          exit: false,
          onKey(event) {
            if (Cli.Keyboard.Is.redraw(event)) redraw();
            if (Cli.Keyboard.Is.back(event) && allowsBack(state.current)) {
              requestStop('back');
              return 'stop';
            }
          },
          onQuit: () => {
            requestStop('quit');
          },
        });
      } catch {
        fail(createOwnedError('start:gui keyboard binding failed.'), 'controls');
      }
      if (!resources.keyboard) {
        fail(createOwnedError('start:gui keyboard unavailable.'), 'controls');
      }
    }

    if (resources.keyboard) {
      const keyboardSettled = () => {
        const reaction = beginObservedReaction();
        releaseForeground();
        if (!closing) {
          failObserved(
            reaction,
            createOwnedError('start:gui keyboard lifecycle failed.'),
            'controls',
          );
        }
      };
      void resources.keyboard.finished.then(keyboardSettled, keyboardSettled);
    }

    if (!blocker() && resources.keyboard && resources.status) {
      try {
        resources.screen = deps.createScreen({
          service: START_GUI_SERVICE.name,
          url: resources.status.url,
          ...screenDisplayAuthority(authorityEvidence),
          ...(recovery ? { recovery } : {}),
          state: stateSource,
          keyboard: true,
          onFailure: (cause) => !closing && fail(cause, 'screen'),
        });
      } catch {
        fail(createOwnedError('start:gui screen acquisition failed.'), 'controls');
      }

      const screen = resources.screen;
      if (screen) {
        void screen.failure.catch((cause) => {
          const reaction = beginObservedReaction();
          if (!closing) failObserved(reaction, cause, 'screen');
        });
        if (screen.kind === 'unavailable') {
          fail(createOwnedError('start:gui screen unavailable.'), 'controls');
        } else if (screen.kind === 'failed') {
          fail(createOwnedError('start:gui screen failed.'), 'screen');
        } else {
          controlsReady = true;
          redraw = () => screen.redraw();
        }
      }
    }

    await Schedule.micro();
    if (!blocker() && controlsReady && resources.status && resources.screen) {
      const warnOpen = (reaction?: ObservedReaction) => {
        if (closing) return;
        presentation ??= Object.freeze({
          kind: 'browser-open-failed',
          url: resources.status!.url,
        });
        try {
          resources.screen!.warnOpen();
        } catch (cause) {
          if (reaction) failObserved(reaction, cause, 'screen');
          else fail(cause, 'screen');
        }
      };
      try {
        const opened = deps.open(root, resources.status.url);
        if (Is.Native.promise(opened)) {
          void opened.catch(() => warnOpen(beginObservedReaction()));
        } else if (opened !== undefined) warnOpen();
      } catch {
        warnOpen();
      }
    }

    await Schedule.micro();
    if (!blocker() && controlsReady) {
      await runBoot({
        root,
        authorityEvidence,
        state,
        signal: work.signal,
        deps,
        resources,
        onApplication(owner) {
          resources.application = owner;
          const applicationSettled = () => {
            const reaction = beginObservedReaction();
            if (!closing) publishObserved(reaction, listenerFailure('application-listener'));
          };
          void owner.finished.then(applicationSettled, applicationSettled);
        },
        publishFailure(cause, operation) {
          fail(cause, operation);
        },
        publishObservedFailure(cause, operation) {
          const reaction = beginObservedReaction();
          failObserved(reaction, cause, operation);
        },
      });
    }

    const event = current ?? await terminal.promise;
    if (event.kind === 'stop') {
      completion = event.completion;
      if (completion === 'external-cancellation' && state.current.kind !== 'failed') {
        state.set(cancelledBootState());
      }
    } else {
      primary = event.failure.error;
      if (controlsReady && retainsFailureForeground(event.failure)) {
        await foreground.promise;
        if (trustedDismissal && isCliPresentableFailure(event.failure)) {
          cliSettledFailure = true;
        }
      }
    }
  } catch (cause) {
    const failure = captureFailure(cause, controlsReady ? 'application-host' : 'controls');
    publish(failure);
    const event = current ?? await terminal.promise;
    if (event.kind === 'failure') primary = event.failure.error;
    else completion = event.completion;
  } finally {
    closing = true;
    removeExternalAbort();
    if (state.current.kind !== 'stopping') {
      try {
        state.set(Boot.stopping);
      } catch {
        // Presentation failure cannot prevent package-owner cleanup.
      }
    }
    abortWork('start:gui.finalized');
  }

  const error = finalError({
    primary,
    cleanup: await closeResources(resources),
    presentation,
  });
  if (error) {
    if (cliSettledFailure) markCliSettledFailure(error);
    throw error;
  }
  if (!completion) throw createOwnedError('start:gui completion unavailable.');
  return startGuiCompletion(completion);
}

function observeExternalAbort(until: AbortSignal | undefined, stop: () => void): () => void {
  if (!until) return () => {};
  const listener = () => stop();
  until.addEventListener('abort', listener, { once: true });
  if (until.aborted) stop();
  return () => until.removeEventListener('abort', listener);
}

async function closeResources(resources: SessionResources): Promise<CleanupEvidence | undefined> {
  const presentation: CleanupIssue[] = [];
  const owned: CleanupIssue[] = [];

  const screenIssue = disposeScreen(resources.screen);
  if (screenIssue) presentation.push(screenIssue);
  const keyboardClosing = closeKeyboard(resources.keyboard);

  const application = resources.application;
  let applicationClosed = true;
  if (application) {
    try {
      await application.close('start:gui.finalized');
    } catch {
      applicationClosed = false;
      owned.push(Object.freeze({
        resource: 'application-listener',
        state: 'failed',
      }));
    }
  }

  let generationClosing = Promise.resolve<CleanupIssue | undefined>(undefined);
  if (resources.generation) {
    if (applicationClosed) {
      generationClosing = closeGeneration(resources.generation);
    } else if (application) {
      deferGenerationRelease(application.finished, resources.generation);
      generationClosing = Promise.resolve(Object.freeze({
        resource: 'release' as const,
        state: 'unresolved' as const,
      }));
    }
  }

  // Status cleanup starts after Generation release is invoked, but does not wait behind a release
  // that may remain pending.
  const statusClosing = closeStatus(resources.status);
  const [generationIssue, statusIssue, keyboardIssue] = await Promise.all([
    generationClosing,
    statusClosing,
    keyboardClosing,
  ]);
  if (keyboardIssue) presentation.push(keyboardIssue);
  if (generationIssue) owned.push(generationIssue);
  if (statusIssue) owned.push(statusIssue);
  return cleanupEvidence([...presentation, ...owned]);
}

function disposeScreen(screen: SessionResources['screen']): CleanupIssue | undefined {
  if (!screen) return;
  try {
    screen.dispose();
  } catch {
    try {
      screen.dispose();
      return Object.freeze({ resource: 'screen', state: 'failed' });
    } catch {
      return Object.freeze({ resource: 'screen', state: 'unresolved' });
    }
  }
}

async function closeKeyboard(
  keyboard: SessionResources['keyboard'],
): Promise<CleanupIssue | undefined> {
  if (!keyboard) return;
  try {
    await Cli.Keyboard.shutdown(keyboard);
  } catch {
    return Object.freeze({ resource: 'keyboard', state: 'failed' });
  }
}

async function closeGeneration(
  generation: t.Dist.Generation.Owner,
): Promise<CleanupIssue | undefined> {
  try {
    await generation.release();
  } catch {
    return Object.freeze({ resource: 'release', state: 'unresolved' });
  }
}

async function closeStatus(
  status: t.BootstrapStatus.Started | undefined,
): Promise<CleanupIssue | undefined> {
  if (!status) return;
  try {
    await status.close('start:gui.finalized');
  } catch {
    return Object.freeze({ resource: 'status-listener', state: 'failed' });
  }
}

function deferGenerationRelease(
  applicationFinished: Promise<void>,
  generation: t.Dist.Generation.Owner,
): void {
  const release = () => {
    try {
      void generation.release().catch(() => undefined);
    } catch {
      // The Server-owned Generation owner retains its terminal release state.
    }
  };
  void applicationFinished.then(release, release);
}

function screenDisplayAuthority(evidence: AuthoritySnapshot): Readonly<{
  root?: t.StringAbsoluteDir;
  manifestUrl?: t.StringUrl;
}> {
  if (evidence.kind === 'invalid') return Object.freeze({});
  const authority = evidence.authority;
  return authority.kind === 'development'
    ? Object.freeze({ root: authority.dir })
    : Object.freeze({ manifestUrl: authority.source.href });
}

function retainsFailureForeground(failure: CapturedFailure): boolean {
  const evidence = failure.state.safeEvidence;
  return !(evidence.kind === 'local' && evidence.operation === 'controls');
}

function isCliPresentableFailure(failure: CapturedFailure): boolean {
  const evidence = failure.state.safeEvidence;
  return evidence.kind !== 'local' ||
    (evidence.operation !== 'controls' && evidence.operation !== 'screen');
}
