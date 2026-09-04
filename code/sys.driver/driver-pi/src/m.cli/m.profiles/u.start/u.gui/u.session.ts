import {
  Arr,
  BootstrapStatus,
  Dist,
  DistServer,
  Err,
  Is,
  Num,
  Obj,
  Open,
  Str,
  type t,
  Time,
} from '../common.ts';
import { runtimeRoot } from '../../../u/u.runtime.ts';
import {
  admitApplicationPkg,
  admitGenerationPkg,
  applicationStartArgs,
  captureStartGuiFailure,
  generationOpenArgs,
  generationOpenFailure,
  listenerFailure,
  packageRefusal,
  snapshotDevelopmentAuthority,
  snapshotReleaseAuthority,
  START_GUI_SERVICE,
} from '../../u/u.start.gui.service.ts';
import { StartGuiPresentation } from './u.presentation.ts';
import type { Start } from './t.ts';

const DEFAULT_DEPENDENCIES: Start.Gui.Dependencies = Object.freeze({
  runtimeRoot,
  startStatus: BootstrapStatus.start,
  openGeneration: Dist.Generation.open,
  startApplication: DistServer.start,
  isHostError: DistServer.Error.is,
  openBrowser: Open.invokeDetached,
  presentation: StartGuiPresentation,
});

// Required common helpers stay available at this package boundary.
void Arr;
void Num;
void Obj;
void Str;
void Time;

/**
 * Start the one canonical Driver Pi GUI release.
 */
export function start(input: Start.Gui.Input): Promise<Start.Gui.Outcome> {
  return startWith(input, DEFAULT_DEPENDENCIES);
}

/**
 * Run the canonical release path through explicit owner dependencies.
 */
export function startWith(
  input: Start.Gui.Input,
  deps: Start.Gui.Dependencies,
): Promise<Start.Gui.Outcome> {
  return compose({
    ...input,
    authority: snapshotReleaseAuthority(),
    recovery: START_GUI_SERVICE.recovery,
  }, deps);
}

/**
 * Start one package-internal completed preview build.
 */
export function startDevelopment(
  input: Start.Gui.Development.Input,
): Promise<Start.Gui.Outcome> {
  return startDevelopmentWith(input, DEFAULT_DEPENDENCIES);
}

/**
 * Run one completed preview build through explicit owner dependencies.
 */
export function startDevelopmentWith(
  input: Start.Gui.Development.Input,
  deps: Start.Gui.Dependencies,
): Promise<Start.Gui.Outcome> {
  return compose({
    cwd: input.cwd,
    until: input.until,
    authority: snapshotDevelopmentAuthority(input.source),
  }, deps);
}

/**
 * Helpers:
 */
/** Compose one GUI session directly from package-owned lifecycles. */
async function compose(
  input: Start.Gui.Composition.Input,
  deps: Start.Gui.Dependencies,
): Promise<Start.Gui.Outcome> {
  const work = new AbortController();
  const outcome = Promise.withResolvers<Start.Gui.Outcome>();
  const dismissal = Promise.withResolvers<void>();
  const externalFailureDismissal = Promise.withResolvers<void>();
  let selected: Start.Gui.Outcome | undefined;
  let failure: Start.Gui.Failure | undefined;
  let terminalError: Error | undefined;
  let statusFinishedRejected = false;
  let presentationUnavailable = false;

  let root: t.StringDir | undefined;
  let rootFailure: Start.Gui.Failure | undefined;
  let status: t.BootstrapStatus.Started | undefined;
  let presentation: Start.Gui.Presentation.Owner | undefined;
  let generation: t.Dist.Generation.Open.Success | undefined;
  let application: Start.Gui.Application.Owner | undefined;
  let applicationReady: Readonly<{ origin: t.StringUrl; digest: t.StringHash }> | undefined;

  let statusEvent: Promise<Start.Gui.Composition.Event.Status> | undefined;
  let presentationEvent: Promise<Start.Gui.Composition.Event.Presentation> | undefined;
  let applicationEvent: Promise<Start.Gui.Composition.Event.Application> | undefined;
  let presentationClose: Promise<void> | undefined;
  let applicationClose: Promise<void> | undefined;
  let generationAfterTermination: Promise<void> | undefined;

  try {
    root = deps.runtimeRoot(input.cwd, 'start:gui');
  } catch (cause) {
    rootFailure = captureStartGuiFailure(cause, 'authority');
  }

  const choose = (next: Start.Gui.Outcome): Start.Gui.Outcome => {
    if (selected) return selected;
    selected = next;
    outcome.resolve(next);
    return next;
  };
  const controlEvent: Promise<Start.Gui.Composition.Event.Control> = outcome.promise.then((value) =>
    Object.freeze({ kind: 'control', outcome: value })
  );
  const onExternalAbort = () => {
    if (selected === 'failed') externalFailureDismissal.resolve();
    else choose('external-cancellation');
  };
  if (input.until?.aborted) onExternalAbort();
  else input.until?.addEventListener('abort', onExternalAbort, { once: true });

  let prepared: Start.Gui.Presentation.Prepared;
  try {
    prepared = deps.presentation.prepare({
      authority: input.authority.ok ? input.authority.authority : undefined,
      recovery: input.recovery,
      onBack: () => choose('back'),
      onQuit: () => choose('quit'),
      onDismiss: () => dismissal.resolve(),
    });
  } catch (cause) {
    input.until?.removeEventListener('abort', onExternalAbort);
    throw Err.std('start:gui presentation preparation failed.', { cause });
  }

  const abortWork = (reason?: unknown) => {
    if (!work.signal.aborted) work.abort(reason);
  };
  const recordError = (cause: unknown, message: string) => {
    terminalError = appendError(terminalError, cause, message);
  };
  const beginPresentationClose = () => {
    if (!presentation || presentationClose) return;
    try {
      presentationClose = presentation.shutdown();
    } catch (cause) {
      presentationClose = Promise.reject(cause);
    }
    void presentationClose.catch(() => undefined);
  };
  const beginApplicationClose = () => {
    if (!application || applicationClose) return;
    try {
      applicationClose = application.close(selected ?? 'start:gui stopping');
    } catch (cause) {
      applicationClose = Promise.reject(cause);
    }
    void applicationClose.catch(() => undefined);
  };
  const requestCleanShutdown = () => {
    beginPresentationClose();
    beginApplicationClose();
    abortWork(selected);
  };
  const presentFailure = () => {
    if (!failure || !presentation || presentationUnavailable) return;
    try {
      presentation.failed(failure);
    } catch (cause) {
      presentationUnavailable = true;
      recordError(cause, 'start:gui failure presentation failed.');
      beginPresentationClose();
    }
  };
  const requestFailure = (next: Start.Gui.Failure) => {
    failure ??= next;
    choose('failed');
    beginApplicationClose();
    abortWork(failure);
    presentFailure();
  };
  const requestTerminalFailure = (cause: unknown, message: string) => {
    choose('failed');
    presentationUnavailable = true;
    recordError(cause, message);
    beginApplicationClose();
    abortWork(cause);
    beginPresentationClose();
  };
  const handleRuntimeEvent = (event: Start.Gui.Composition.Event.Runtime) => {
    switch (event.kind) {
      case 'control':
        requestCleanShutdown();
        return;
      case 'status-finished': {
        const next = listenerFailure('status-listener', event.cause);
        if (event.rejected) {
          statusFinishedRejected = true;
          recordError(event.cause ?? next.error, 'start:gui status host failed.');
        }
        requestFailure(next);
        return;
      }
      case 'presentation-lost':
        requestTerminalFailure(event.cause, 'start:gui presentation failed.');
        return;
      case 'application-finished':
        requestFailure(listenerFailure('application-listener', event.cause));
        return;
    }
  };
  const bindStatus = (owner: t.BootstrapStatus.Started) => {
    status = owner;
    statusEvent = owner.finished.then(
      () => Object.freeze({ kind: 'status-finished', rejected: false }),
      (cause) => Object.freeze({ kind: 'status-finished', rejected: true, cause }),
    );
  };
  const bindPresentation = (owner: Start.Gui.Presentation.Owner) => {
    presentation = owner;
    presentationEvent = owner.lost.then(
      () =>
        Object.freeze({
          kind: 'presentation-lost',
          cause: Err.std('start:gui presentation stopped unexpectedly.'),
        }),
      (cause) => Object.freeze({ kind: 'presentation-lost', cause }),
    );
    if (selected === 'failed') {
      if (presentationUnavailable) beginPresentationClose();
      else presentFailure();
    } else if (selected) {
      requestCleanShutdown();
    }
  };
  const bindApplication = (owner: Start.Gui.Application.Owner) => {
    application = owner;
    applicationEvent = owner.finished.then(
      () => Object.freeze({ kind: 'application-finished', rejected: false }),
      (cause) => Object.freeze({ kind: 'application-finished', rejected: true, cause }),
    );
    if (selected) beginApplicationClose();
  };

  try {
    const statusOperation = observeOperation(() => deps.startStatus(prepared.status));
    const statusFirst = await Promise.race([statusOperation, controlEvent]);
    if (statusFirst.kind === 'control') {
      requestCleanShutdown();
      const drained = await statusOperation;
      if (drained.kind === 'operation') bindStatus(drained.value);
      else recordError(drained.cause, 'start:gui status startup failed after cancellation.');
    } else if (statusFirst.kind === 'operation-error') {
      requestTerminalFailure(statusFirst.cause, 'start:gui status startup failed.');
    } else {
      bindStatus(statusFirst.value);
    }

    if (!selected) {
      const presentationOperation = observeOperation(() => prepared.acquire(status!.url));
      const presentationFirst = await Promise.race([
        presentationOperation,
        controlEvent,
        statusEvent!,
      ]);
      if (presentationFirst.kind === 'operation') {
        bindPresentation(presentationFirst.value);
      } else if (presentationFirst.kind === 'operation-error') {
        requestTerminalFailure(
          presentationFirst.cause,
          'start:gui presentation acquisition failed.',
        );
      } else {
        handleRuntimeEvent(presentationFirst);
        const drained = await presentationOperation;
        if (drained.kind === 'operation') bindPresentation(drained.value);
        else {
          recordError(
            drained.cause,
            'start:gui presentation acquisition failed while stopping.',
          );
        }
      }
    }

    if (!selected) {
      try {
        deps.openBrowser(root ?? input.cwd.invoked, status!.url);
      } catch {
        try {
          presentation!.warnOpen();
        } catch (cause) {
          requestTerminalFailure(cause, 'start:gui presentation failed.');
        }
      }
    }

    if (!selected && !input.authority.ok) requestFailure(input.authority.failure);
    if (!selected && rootFailure) requestFailure(rootFailure);

    const authority = input.authority.ok ? input.authority.authority : undefined;
    if (!selected && authority?.kind === 'release') {
      const generationOperation = observeOperation(() =>
        deps.openGeneration(generationOpenArgs(root!, authority, work.signal))
      );
      const generationFirst = await Promise.race([
        generationOperation,
        controlEvent,
        statusEvent!,
        presentationEvent!,
      ]);
      if (generationFirst.kind === 'operation') {
        if (generationFirst.value.kind === 'opened') {
          generation = generationFirst.value;
          if (!admitGenerationPkg(authority, generation.generation)) {
            requestFailure(packageRefusal());
          }
        } else {
          requestFailure(generationOpenFailure(generationFirst.value));
        }
      } else if (generationFirst.kind === 'operation-error') {
        requestTerminalFailure(
          generationFirst.cause,
          'start:gui generation opening failed.',
        );
      } else {
        handleRuntimeEvent(generationFirst);
        const drained = await generationOperation;
        if (drained.kind === 'operation' && drained.value.kind === 'opened') {
          generation = drained.value;
        } else if (drained.kind === 'operation-error') {
          recordError(drained.cause, 'start:gui generation opening failed while stopping.');
        }
      }
    }

    if (!selected) {
      try {
        presentation!.starting();
      } catch (cause) {
        requestTerminalFailure(cause, 'start:gui presentation failed.');
      }
    }

    if (!selected && authority) {
      const dir = authority.kind === 'release' ? generation!.generation.dir : authority.dir;
      const applicationOperation = observeOperation(() =>
        deps.startApplication(applicationStartArgs(authority, dir, work.signal))
      );
      const applicationFirst = await Promise.race([
        applicationOperation,
        controlEvent,
        statusEvent!,
        presentationEvent!,
      ]);
      if (applicationFirst.kind === 'operation') {
        bindApplication(applicationFirst.value);
        applicationReady = admitApplicationPkg(authority, applicationFirst.value);
        if (!applicationReady) requestFailure(packageRefusal());
      } else if (applicationFirst.kind === 'operation-error') {
        if (deps.isHostError(applicationFirst.cause)) {
          requestFailure(captureStartGuiFailure(applicationFirst.cause, 'application-host'));
        } else {
          requestTerminalFailure(
            applicationFirst.cause,
            'start:gui application startup failed.',
          );
        }
      } else {
        handleRuntimeEvent(applicationFirst);
        const drained = await applicationOperation;
        if (drained.kind === 'operation') {
          bindApplication(drained.value);
        } else if (!isExpectedHostCancellation(drained.cause, work.signal, deps)) {
          recordError(drained.cause, 'start:gui application startup failed while stopping.');
        }
      }
    }

    if (!selected && authority && applicationReady) {
      try {
        const readiness = await Promise.race([
          controlEvent,
          statusEvent!,
          presentationEvent!,
          application!.finished,
          Promise.resolve(Object.freeze({ kind: 'publish-ready' as const })),
        ]);
        if (readiness === undefined) {
          handleRuntimeEvent(Object.freeze({ kind: 'application-finished', rejected: false }));
        } else if (readiness.kind === 'publish-ready') {
          try {
            presentation!.ready({
              ...applicationReady,
              dir: authority.kind === 'release' ? generation!.generation.dir : authority.dir,
            });
          } catch (cause) {
            requestTerminalFailure(cause, 'start:gui presentation failed.');
          }
        } else {
          handleRuntimeEvent(readiness);
        }
      } catch (cause) {
        handleRuntimeEvent(Object.freeze({ kind: 'application-finished', rejected: true, cause }));
      }
    }

    if (!selected) {
      const running = await Promise.race([
        controlEvent,
        statusEvent!,
        presentationEvent!,
        applicationEvent!,
      ]);
      handleRuntimeEvent(running);
    }

    if (selected === 'back' || selected === 'quit' || selected === 'external-cancellation') {
      requestCleanShutdown();
    } else {
      beginApplicationClose();
      abortWork(failure ?? terminalError);
    }

    beginGenerationSettlement();

    if (selected === 'failed' && failure && presentation && !presentationUnavailable) {
      const foreground = await Promise.race([
        dismissal.promise.then(() => Object.freeze({ kind: 'dismissed' as const })),
        externalFailureDismissal.promise.then(() =>
          Object.freeze({ kind: 'external-dismissal' as const })
        ),
        presentationEvent!,
      ]);
      if (foreground.kind === 'presentation-lost') {
        requestTerminalFailure(foreground.cause, 'start:gui presentation failed.');
      }
    }
    beginPresentationClose();

    input.until?.removeEventListener('abort', onExternalAbort);

    if (applicationEvent) {
      const finished = await applicationEvent;
      if (finished.rejected) {
        recordError(finished.cause, 'start:gui application termination failed.');
      }
    }

    if (generationAfterTermination) {
      try {
        await generationAfterTermination;
      } catch (cause) {
        recordError(cause, 'start:gui generation release failed.');
      }
    }

    if (presentationClose) {
      try {
        await presentationClose;
      } catch (cause) {
        recordError(cause, 'start:gui presentation shutdown failed.');
      }
    }

    if (applicationClose) {
      try {
        await applicationClose;
      } catch (cause) {
        recordError(cause, 'start:gui application close failed.');
      }
    }

    if (status) {
      let closeRejected = false;
      let closeCause: unknown;
      try {
        await status.close(selected ?? terminalError);
      } catch (cause) {
        closeRejected = true;
        closeCause = cause;
      }

      const finished = await statusEvent!;
      if (finished.rejected) {
        if (!statusFinishedRejected) {
          statusFinishedRejected = true;
          recordError(finished.cause, 'start:gui status host failed.');
        }
      } else if (closeRejected) {
        recordError(closeCause, 'start:gui status shutdown failed.');
      }
    }

    if (terminalError) throw terminalError;
    if (!selected) throw Err.std('start:gui session ended without an outcome.');
    return selected;
  } finally {
    input.until?.removeEventListener('abort', onExternalAbort);
  }

  function beginGenerationSettlement(): void {
    if (!generation || generationAfterTermination) return;
    const release = () => {
      let operation: Promise<void>;
      try {
        operation = generation!.owner.release();
      } catch (cause) {
        operation = Promise.reject(cause);
      }
      void operation.catch(() => undefined);
      return operation;
    };
    generationAfterTermination = applicationEvent ? applicationEvent.then(release) : release();
    void generationAfterTermination.catch(() => undefined);
  }
}

function observeOperation<T>(
  start: () => Promise<T>,
): Promise<Start.Gui.Composition.Event.Operation<T>> {
  try {
    return start().then(
      (value) => Object.freeze({ kind: 'operation', value }),
      (cause) => Object.freeze({ kind: 'operation-error', cause }),
    );
  } catch (cause) {
    return Promise.resolve(Object.freeze({ kind: 'operation-error', cause }));
  }
}

function isExpectedHostCancellation(
  cause: unknown,
  signal: AbortSignal,
  deps: Start.Gui.Dependencies,
): boolean {
  return signal.aborted && deps.isHostError(cause) && cause.reason === 'cancelled';
}

function appendError(current: Error | undefined, cause: unknown, message: string): Error {
  const next = Is.error(cause) ? cause : Err.std(message, { cause });
  return current ? new SuppressedError(current, next, message) : next;
}
