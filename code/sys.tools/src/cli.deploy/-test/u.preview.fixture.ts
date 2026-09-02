import { Fs, Path, Pkg, type t } from '../common.ts';
import { DEPLOY_DIST_VERIFY_LIMITS } from '../u.staging/u.verifyStagedDist.ts';
import { withTmpDir } from './u.fixture.ts';

type PreviewAction = t.DeployPreview.Action;

type PreviewDistFixture = {
  readonly cwd: t.StringDir;
  readonly root: t.StringAbsoluteDir;
  readonly evidence: t.Pkg.Dist.Local.Verify.Evidence;
};

/** Run a test against one complete, freshly verified sample Dist. */
export async function withPreviewDist(
  fn: (fixture: PreviewDistFixture) => Promise<void> | void,
): Promise<void> {
  await withTmpDir(async (cwd) => {
    const root = Path.resolve(cwd, 'staging');
    await Fs.ensureDir(`${root}/assets`);
    await Fs.ensureDir(`${root}/guides & refs`);
    await Fs.write(`${root}/index.html`, '<h1>root</h1>\n');
    await Fs.write(`${root}/assets/app.js`, 'export const ready = true;\n');
    await Fs.write(`${root}/guides & refs/index.html`, '<h1>nested</h1>\n');
    await Pkg.Dist.compute({ dir: root, save: true });

    const verified = await Pkg.Dist.Local.verify({
      dir: root,
      limits: DEPLOY_DIST_VERIFY_LIMITS,
    });
    if (verified.kind !== 'verified') {
      throw new Error(`Preview fixture verification failed: ${verified.kind}`);
    }
    await fn(Object.freeze({ cwd, root, evidence: verified.evidence }));
  });
}

/** Create a pending prompt whose first disposal settles as cancellation. */
export function createPendingPreviewPromptStarted(
  dispose: (reason?: unknown) => void | Promise<void> = () => undefined,
): t.DeployPreview.PromptStarted {
  const completion = Promise.withResolvers<t.DeployPreview.PromptOutcome>();
  let disposal: Promise<void> | undefined;
  return Object.freeze({
    finished: completion.promise,
    dispose(reason?: unknown) {
      return disposal ??= (async () => {
        await dispose(reason);
        completion.resolve(Object.freeze({ kind: 'cancelled' }));
        await completion.promise;
      })();
    },
  });
}

/** Create an owned preview prompt that settles with one selected action. */
export function createPreviewPromptStarted(
  action: PreviewAction | PromiseLike<PreviewAction>,
  dispose: (reason?: unknown) => void | Promise<void> = () => undefined,
): t.DeployPreview.PromptStarted {
  const finished: Promise<t.DeployPreview.PromptOutcome> = Promise.resolve(action).then((value) =>
    Object.freeze({ kind: 'selected', value })
  );
  return Object.freeze({
    finished,
    async dispose(reason?: unknown) {
      await dispose(reason);
      await finished;
    },
  });
}

/** Create the minimum running preview authority required by the session owner. */
export function createPreviewStarted(
  evidence: t.Pkg.Dist.Local.Verify.Evidence,
  origin: t.StringUrl,
  close: (reason?: unknown) => void | Promise<void>,
  lifecycle: {
    readonly controller?: AbortController;
    readonly finished?: Promise<void>;
  } = {},
): t.DeployPreview.Started {
  const controller = lifecycle.controller ?? new AbortController();
  const completion = Promise.withResolvers<void>();
  const ownsCompletion = lifecycle.finished === undefined;
  const finished = lifecycle.finished ?? completion.promise;

  return Object.freeze({
    origin,
    verification: evidence,
    signal: controller.signal,
    finished,
    async close(reason?: unknown) {
      if (!controller.signal.aborted) controller.abort(reason);
      try {
        await close(reason);
        if (ownsCompletion) completion.resolve();
        await finished;
      } catch (cause) {
        if (ownsCompletion) completion.reject(cause);
        throw cause;
      }
    },
  });
}
