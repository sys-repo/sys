import { DistServer } from '@sys/server/dist/server';
import { c, Cli, Dispose, Fmt, Obj, Open, Pkg, Str, type t, Time } from './common.ts';
import { DEPLOY_DIST_VERIFY_LIMITS } from './u.staging/u.verifyStagedDist.ts';

type PreviewAction = t.DeployPreview.Action;
type PreviewDependencies = t.DeployPreview.Dependencies;
type PreviewFailureReason = t.DeployPreview.FailureReason;
type PreviewPromptStarted = t.DeployPreview.PromptStarted;
type PreviewStarted = t.DeployPreview.Started;
type PreviewOption = { name: string; value: PreviewAction };

type GenerationObservation = Readonly<{
  changed: Promise<void>;
  reason(): PreviewFailureReason | undefined;
  dispose(): void;
}>;

type PreviewGeneration = Readonly<{
  started: PreviewStarted;
  observation: GenerationObservation;
}>;

type PromptEvent =
  | { readonly kind: 'settled'; readonly outcome: t.DeployPreview.PromptOutcome }
  | { readonly kind: 'failed'; readonly cause: unknown };
type PromptRaceEvent = PromptEvent | { readonly kind: 'stopped' };

/** Default strict loopback port for verified Deploy previews. */
export const DEPLOY_PREVIEW_PORT: t.PortNumber = 4040;

const CANCELLED_PROMPT_EVENT: PromptEvent = Object.freeze({
  kind: 'settled',
  outcome: Object.freeze({ kind: 'cancelled' }),
});
const STOPPED_PROMPT_EVENT: PromptRaceEvent = Object.freeze({ kind: 'stopped' });
const DEFAULT_DEPENDENCIES: PreviewDependencies = Object.freeze({
  start: DistServer.Local.start,
  prompt: promptDeployPreview,
  open: (cwd, url) => Open.invokeDetached(cwd, url, { silent: true }),
});

/**
 * Obtain fresh exact-root evidence for endpoint-menu status without starting a listener.
 */
export async function verifyDeployPreview(
  dir: t.StringDir,
  until?: t.UntilInput,
): Promise<t.DeployPreview.Status> {
  try {
    const result = await Pkg.Dist.Local.verify({
      dir,
      limits: DEPLOY_DIST_VERIFY_LIMITS,
      until,
    });
    if (result.kind === 'verified') {
      return Object.freeze({ kind: 'verified', evidence: result.evidence });
    }
    return unavailable(result.kind);
  } catch {
    return unavailable('io-failure');
  }
}

/** Derive browser choices solely from the exact part map verified at server startup. */
export function deployPreviewChoices(
  started: Pick<PreviewStarted, 'origin' | 'verification'>,
): readonly t.DeployPreview.Choice[] {
  const paths = Obj.keys(started.verification.dist.hash.parts).map(String).filter((path) =>
    path === 'index.html' || path.endsWith('/index.html')
  );
  const natural = Str.Compare.natural();
  const codeUnit = Str.Compare.codeUnit();
  paths.sort((a, b) => {
    if (a === b) return 0;
    if (a === 'index.html') return -1;
    if (b === 'index.html') return 1;
    return natural(a, b) || codeUnit(a, b);
  });

  return Object.freeze(paths.map((partPath) => {
    const path = partPath === 'index.html' ? '/' : `/${encodePartPath(partPath)}`;
    return Object.freeze({ kind: 'open', path, url: `${started.origin}${path}` });
  }));
}

/**
 * Own one verified local Dist listener through browser actions, reload, and cancellation.
 */
export function runDeployPreviewSession(
  args: t.DeployPreview.SessionArgs,
): Promise<t.DeployPreview.SessionResult> {
  return runDeployPreviewSessionWith(args, DEFAULT_DEPENDENCIES);
}

/** Internal deterministic preview-session runner with explicit effects. */
export async function runDeployPreviewSessionWith(
  args: t.DeployPreview.SessionArgs,
  deps: PreviewDependencies,
): Promise<t.DeployPreview.SessionResult> {
  const life = Dispose.abortable(args.until);
  let current: PreviewGeneration | undefined;

  const closeStarted = async (started: PreviewStarted, reason: string): Promise<boolean> => {
    try {
      await started.close(reason);
      return true;
    } catch {
      return false;
    }
  };
  const closeCurrent = async (reason: string): Promise<boolean> => {
    const owned = current;
    current = undefined;
    if (!owned) return true;

    let succeeded = true;
    try {
      owned.observation.dispose();
    } catch {
      succeeded = false;
    }
    if (!await closeStarted(owned.started, reason)) succeeded = false;
    return succeeded;
  };

  const run = async (): Promise<t.DeployPreview.SessionResult> => {
    await Time.wait(); // Settle pre-cancelled UntilInput before listener admission.
    while (true) {
      if (!current) {
        if (life.signal.aborted) return failed('cancelled');
        let started: PreviewStarted | undefined;
        try {
          started = await deps.start({
            dir: args.dir,
            limits: DEPLOY_DIST_VERIFY_LIMITS,
            hostname: '127.0.0.1',
            port: args.port ?? DEPLOY_PREVIEW_PORT,
            name: args.name,
            silent: true,
            keyboard: false,
            until: life.signal,
          });
          current = Object.freeze({
            started,
            observation: observeGeneration(started, life.signal),
          });
          await Promise.resolve(); // Admit already-settled listener completion before prompting.
        } catch (error) {
          if (started && !current) {
            await closeStarted(started, 'deploy.preview.start.failed');
          }
          const reason = DistServer.Error.is(error) ? error.reason : 'startup-failure';
          return failed(reason);
        }
      }

      const { started, observation } = current;
      const stoppedBeforePrompt = observation.reason();
      if (stoppedBeforePrompt) return failed(stoppedBeforePrompt);

      const prompt = deps.prompt({
        name: args.name,
        origin: started.origin,
        choices: deployPreviewChoices(started),
      });
      const event = await promptOrStop(prompt, observation);
      const stoppedAfterPrompt = observation.reason();
      if (stoppedAfterPrompt) return failed(stoppedAfterPrompt);
      if (event.kind === 'failed') throw event.cause;
      if (event.outcome.kind === 'cancelled') return failed('cancelled');

      const action = event.outcome.value;
      const stoppedBeforeAction = observation.reason();
      if (stoppedBeforeAction) return failed(stoppedBeforeAction);
      if (action.kind === 'back') return Object.freeze({ ok: true });
      if (action.kind === 'reload') {
        if (!await closeCurrent('deploy.preview.reload')) return failed('startup-failure');
        continue;
      }

      await Promise.resolve(); // Settle queued cancellation/listener reactions before opening.
      const stoppedBeforeOpen = observation.reason();
      if (stoppedBeforeOpen) return failed(stoppedBeforeOpen);
      deps.open(args.cwd, action.url);
    }
  };

  let outcome:
    | { readonly kind: 'returned'; readonly value: t.DeployPreview.SessionResult }
    | { readonly kind: 'thrown'; readonly cause: unknown };
  try {
    outcome = { kind: 'returned', value: await run() };
  } catch (cause) {
    outcome = { kind: 'thrown', cause };
  }

  let cleanupSucceeded = await closeCurrent('deploy.preview.close');
  try {
    life.dispose('deploy.preview.complete');
  } catch {
    cleanupSucceeded = false;
  }

  // Preserve the causal primary failure; failed cleanup can only revoke a successful session.
  if (outcome.kind === 'thrown') throw outcome.cause;
  if (!cleanupSucceeded && outcome.value.ok) return failed('startup-failure');
  return outcome.value;
}

/** Helpers: */
function promptDeployPreview(input: t.DeployPreview.PromptInput): PreviewPromptStarted {
  const options: PreviewOption[] = [
    ...input.choices.map((choice) => ({
      name: `  open ${c.cyan(choice.path)}`,
      value: choice,
    })),
    { name: c.dim(c.gray('  ↻ reload')), value: { kind: 'reload' } },
    { name: Fmt.back({ indent: '  ' }), value: { kind: 'back' } },
  ];

  console.clear();
  console.info(
    String(
      Str.builder()
        .blank()
        .line(`  Preview ${c.cyan(input.name)}`)
        .line(`  Listening on ${c.cyan(`${input.origin}/`)}`)
        .blank(),
    ),
  );

  return Cli.Input.Select.start<PreviewAction>({
    message: 'Verified Dist',
    options,
    hideDefault: true,
    maxRows: 20,
  });
}

async function promptOrStop(
  prompt: PreviewPromptStarted,
  observation: GenerationObservation,
): Promise<PromptEvent> {
  if (observation.reason()) {
    await settleLosingPrompt(prompt);
    return CANCELLED_PROMPT_EVENT;
  }

  const promptEvent: Promise<PromptEvent> = prompt.finished.then(
    (outcome) => Object.freeze({ kind: 'settled', outcome }),
    (cause) => Object.freeze({ kind: 'failed', cause }),
  );
  const generationStopped = observation.changed.then(() => STOPPED_PROMPT_EVENT);
  const winner = await Promise.race([promptEvent, generationStopped]);

  if (observation.reason() || winner.kind === 'stopped') {
    await settleLosingPrompt(prompt);
    return CANCELLED_PROMPT_EVENT;
  }
  return winner;
}

async function settleLosingPrompt(prompt: PreviewPromptStarted): Promise<void> {
  try {
    await prompt.dispose('deploy.preview.prompt.stop');
  } catch {
    // The prompt settlement below is the authoritative completion boundary.
  }
  try {
    await prompt.finished;
  } catch {
    // Cancellation or listener failure remains the primary sanitized session outcome.
  }
}

function observeGeneration(
  started: PreviewStarted,
  cancellation: AbortSignal,
): GenerationObservation {
  const change = Promise.withResolvers<void>();
  let listenerSettled = false;
  let changedSettled = false;
  const notify = () => {
    if (changedSettled) return;
    changedSettled = true;
    change.resolve();
  };
  const onCancelled = () => notify();
  const onListenerAbort = () => notify();
  const onListenerSettled = () => {
    listenerSettled = true;
    notify();
  };

  cancellation.addEventListener('abort', onCancelled, { once: true });
  started.signal.addEventListener('abort', onListenerAbort, { once: true });
  void started.finished.then(onListenerSettled, onListenerSettled);
  if (cancellation.aborted || started.signal.aborted) notify();

  return Object.freeze({
    changed: change.promise,
    reason() {
      if (cancellation.aborted) return 'cancelled';
      if (started.signal.aborted || listenerSettled) return 'startup-failure';
      return undefined;
    },
    dispose() {
      cancellation.removeEventListener('abort', onCancelled);
      started.signal.removeEventListener('abort', onListenerAbort);
    },
  });
}

function unavailable(reason: t.Pkg.Dist.Local.Verify.FailureKind): t.DeployPreview.Status {
  return Object.freeze({ kind: 'unavailable', reason });
}

function failed(reason: PreviewFailureReason): t.DeployPreview.SessionResult {
  return Object.freeze({ ok: false, reason });
}

function encodePartPath(path: string): string {
  return path.split('/').map((segment) => encodeURIComponent(segment)).join('/');
}
