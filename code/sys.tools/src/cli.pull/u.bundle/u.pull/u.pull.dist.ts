import { c, Cli, Dist, Err, Fs, Is, Rx, Schedule, type t, Url } from './common.ts';
import { Fmt } from '../../u.fmt.ts';
import { rewriteProjectionTags } from '../u.pull.rewriteTags.ts';
import { clearTargetDir } from './u.clearTargetDir.ts';

const MIB = 1024 * 1024;
const MANIFEST_BYTES = 16 * MIB;
const FILE_BYTES = 128 * MIB;
const TOTAL_BYTES = 1024 * MIB;
const MAX_RESOURCES = 4096;

/**
 * Materialize one checksum-pinned generation, then optionally copy it into a mutable projection.
 *
 * Only an `existing` or `promoted` generation may be copied. Verification evidence remains on
 * `generation`; copied or HTML-rewritten bytes never inherit it. A projection failure preserves the
 * pinned generation outcome while returning an unsuccessful bundle result.
 */
export async function pullDistBundle(
  baseDir: t.StringDir,
  bundle: t.PullTool.ConfigYaml.DistBundle,
  options: t.PullTool.Bundle.RunOptions = {},
): Promise<t.PullTool.Bundle.Dist.Result> {
  const spinner = options.silent ? undefined : Cli.spinner();
  const life = Rx.abortable(options.until);

  try {
    spinner?.start(Fmt.spinnerText('materializing checksum-pinned dist...'));
    await Schedule.micro();
    const source = manifestSource(bundle.manifest);
    const canonicalBase = await Fs.realPath(baseDir) as t.StringDir;
    const storeDir = resolveWithin(canonicalBase, bundle.store, 'Dist store');
    const generation = await Dist.materialize({
      manifestUrl: source.href,
      integrity: bundle.integrity,
      storeDir,
      policy: materializePolicy(source.origin),
      until: life.signal,
    });

    if (generation.kind === 'failed') {
      spinner?.fail(Fmt.spinnerText(formatMaterializationFailure(generation)));
      return {
        ok: false,
        kind: 'materialization-failed',
        generation,
        projection: { kind: 'not-run' },
      };
    }

    const project = bundle.project;
    if (!project) {
      spinner?.succeed(Fmt.spinnerText(c.gray(`${c.green(generation.kind)} generation`)));
      return {
        ok: true,
        kind: 'dist',
        generation,
        projection: { kind: 'not-requested' },
      };
    }

    const projection = await projectGeneration(
      canonicalBase,
      generation,
      project,
      life.signal,
    );
    if (projection.kind === 'failed') {
      spinner?.fail(Fmt.spinnerText(projection.error));
      return {
        ok: false,
        kind: 'projection-failed',
        generation,
        projection,
      };
    }

    const msg = `${c.green(generation.kind)} → ${c.cyan(project.dir)} (mutable projection)`;
    spinner?.succeed(Fmt.spinnerText(c.gray(msg)));
    return { ok: true, kind: 'dist', generation, projection };
  } finally {
    life.dispose('tools.pull.dist.complete');
    spinner?.stop();
  }
}

async function projectGeneration(
  baseDir: t.StringDir,
  generation: t.Dist.Existing | t.Dist.Promoted,
  project: t.PullTool.ConfigYaml.DistProject,
  signal: AbortSignal,
): Promise<t.PullTool.Bundle.Dist.Projection.Success | t.PullTool.Bundle.Dist.Projection.Failure> {
  let dir: t.StringAbsoluteDir;
  try {
    dir = resolveWithin(baseDir, project.dir, 'Dist projection');
  } catch (error) {
    return projectionFailure(
      Fs.Path.resolve(baseDir, project.dir) as t.StringAbsoluteDir,
      project.mode,
      'invalid-target',
      error,
    );
  }

  if (signal.aborted) return cancelledProjection(dir, project.mode);

  let rooted: t.FsRooted.Instance;
  let target: t.FsRooted.Target<'directory'>;
  try {
    rooted = await Fs.Capability.Rooted.create({ root: baseDir, until: signal });
    const admitted = await rooted.Target.admit(
      [{ kind: 'directory', path: project.dir }],
      { until: signal },
    );
    target = admitted.targets[0];
  } catch (error) {
    const reason = signal.aborted ? 'cancelled' : 'invalid-target';
    return projectionFailure(dir, project.mode, reason, error);
  }

  let stage: t.FsRooted.Stage;
  try {
    stage = await rooted.Stage.create({ until: signal });
  } catch (error) {
    return projectionFailure(
      dir,
      project.mode,
      signal.aborted ? 'cancelled' : 'filesystem-failure',
      error,
    );
  }
  try {
    await populateProjectionStage(stage, generation, signal);
  } catch (error) {
    const cleanupError = await discardProjectionStage(rooted, stage);
    return projectionFailure(
      dir,
      project.mode,
      cleanupError ? 'filesystem-failure' : signal.aborted ? 'cancelled' : 'filesystem-failure',
      cleanupError ?? error,
    );
  }

  let acquired: t.FsRooted.LeaseResult;
  try {
    acquired = await rooted.Lease.acquire([target], {
      mode: 'exclusive',
      wait: true,
      until: signal,
    });
  } catch (error) {
    const cleanupError = await discardProjectionStage(rooted, stage);
    return projectionFailure(
      dir,
      project.mode,
      cleanupError ? 'filesystem-failure' : signal.aborted ? 'cancelled' : 'filesystem-failure',
      cleanupError ?? error,
    );
  }
  if (acquired.kind !== 'acquired') {
    const cleanupError = await discardProjectionStage(rooted, stage);
    return projectionFailure(
      dir,
      project.mode,
      'filesystem-failure',
      cleanupError ?? 'Dist projection target remained busy.',
    );
  }

  let outcome:
    | t.PullTool.Bundle.Dist.Projection.Success
    | t.PullTool.Bundle.Dist.Projection.Failure;
  try {
    if (project.mode === 'replace') await clearTargetDir({ baseDir, targetDir: dir });
    if (signal.aborted) {
      outcome = cancelledProjection(dir, project.mode);
    } else {
      const promoted = await rooted.Stage.promote(stage, target, {
        lease: acquired.lease,
        until: signal,
      });
      if (promoted.kind === 'occupied') {
        outcome = projectionFailure(
          dir,
          project.mode,
          'target-occupied',
          'Dist projection target is occupied.',
        );
      } else if (promoted.cleanupError) {
        outcome = projectionFailure(
          dir,
          project.mode,
          promoted.cleanupError.kind === 'cancelled' ? 'cancelled' : 'filesystem-failure',
          promoted.cleanupError,
        );
      } else if (signal.aborted) {
        outcome = cancelledProjection(dir, project.mode);
      } else {
        try {
          await rewriteProjectionTags(baseDir, dir);
          outcome = { kind: 'projected', dir, mode: project.mode };
        } catch (error) {
          outcome = projectionFailure(dir, project.mode, 'rewrite-failure', error);
        }
      }
    }
  } catch (error) {
    outcome = projectionFailure(
      dir,
      project.mode,
      signal.aborted ? 'cancelled' : 'filesystem-failure',
      error,
    );
  }

  const cleanupError = await discardProjectionStage(rooted, stage);
  let releaseError: unknown;
  try {
    await acquired.lease.release();
  } catch (error) {
    releaseError = error;
  }
  if (cleanupError || releaseError) {
    return projectionFailure(
      dir,
      project.mode,
      'filesystem-failure',
      cleanupError ?? releaseError,
    );
  }
  return outcome;
}

async function populateProjectionStage(
  stage: t.FsRooted.Stage,
  generation: t.Dist.Existing | t.Dist.Promoted,
  signal: AbortSignal,
): Promise<void> {
  const paths = ['dist.json', ...Object.keys(generation.verification.dist.hash.parts)];
  const admitted = await stage.files.Target.admit(
    paths.map((path) => ({ kind: 'file' as const, path })),
    { until: signal },
  );
  for (const target of admitted.targets) {
    if (signal.aborted) throw new Error('Dist projection cancelled.');
    const bytes = await Deno.readFile(Fs.join(generation.dir, target.path), { signal });
    await stage.files.File.publish(target, bytes, { until: signal });
  }
}

async function discardProjectionStage(
  rooted: t.FsRooted.Instance,
  stage: t.FsRooted.Stage,
): Promise<unknown | undefined> {
  try {
    await rooted.Stage.discard(stage);
    return undefined;
  } catch (error) {
    return error;
  }
}

function cancelledProjection(
  dir: t.StringAbsoluteDir,
  mode: t.GithubPull.Mode,
): t.PullTool.Bundle.Dist.Projection.Failure {
  return projectionFailure(dir, mode, 'cancelled', 'Dist projection cancelled.');
}

/** Bind Pull's fixed finite materialization authority to the configured manifest origin. */
function materializePolicy(origin: t.StringUrl): t.Dist.Policy {
  const response = {
    maxBytes: FILE_BYTES,
    timeout: 60_000,
    maxRedirects: 3,
    progressInterval: 100,
    sourceOrigins: [origin],
    credentialOrigins: [],
  } as const;

  return {
    manifest: {
      ...response,
      maxBytes: MANIFEST_BYTES,
      timeout: 30_000,
    },
    resources: {
      response,
      maxResources: MAX_RESOURCES,
      concurrency: 4,
      maxAttempts: 4,
      retryDelay: 250,
      maxRetryElapsed: 2 * 60_000,
      maxTotalBytes: TOTAL_BYTES,
      totalTimeout: 10 * 60_000,
    },
    verification: {
      manifestBytes: MANIFEST_BYTES,
      entries: MAX_RESOURCES * 2 + 1,
      fileBytes: FILE_BYTES,
      totalBytes: TOTAL_BYTES,
    },
  };
}

function manifestSource(input: t.StringUrl): { href: t.StringUrl; origin: t.StringUrl } {
  if (!Is.urlString(input)) throw new Error('Invalid Dist manifest URL.');
  const parsed = Url.parse(input);
  if (!parsed.ok) throw new Error('Invalid Dist manifest URL.');
  const url = parsed.toURL();
  if (url.username || url.password) throw new Error('Invalid Dist manifest URL.');
  url.hash = '';
  return { href: url.href as t.StringUrl, origin: url.origin as t.StringUrl };
}

function resolveWithin(
  baseDir: t.StringDir,
  input: t.StringRelativeDir,
  label: string,
): t.StringAbsoluteDir {
  const base = Fs.Path.resolve(baseDir);
  const target = Fs.Path.resolve(baseDir, input);
  const relative = Fs.Path.relative(base, target).replaceAll('\\', '/');
  const inside = relative.length > 0 && relative !== '.' && relative !== '..' &&
    !relative.startsWith('../');
  if (!inside) throw new Error(`${label} must be a child directory under the config root.`);
  return target as t.StringAbsoluteDir;
}

function projectionFailure(
  dir: t.StringAbsoluteDir,
  mode: t.GithubPull.Mode,
  reason: t.PullTool.Bundle.Dist.Projection.Failure['reason'],
  error: unknown,
): t.PullTool.Bundle.Dist.Projection.Failure {
  return {
    kind: 'failed',
    reason,
    dir,
    mode,
    error: Err.summary(error, { cause: false, stack: false }) || 'Dist projection failed.',
  };
}

function formatMaterializationFailure(failure: t.Dist.Failed): string {
  return `Dist materialization failed: ${failure.stage}/${failure.reason}`;
}
