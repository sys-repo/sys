import { c, Cli, Dist, Err, Fs, Is, Rx, type t, Url } from './common.ts';
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
 * immutable generation outcome while returning an unsuccessful bundle result.
 */
export async function pullDistBundle(
  baseDir: t.StringDir,
  bundle: t.PullTool.ConfigYaml.DistBundle,
  options: t.PullTool.Bundle.RunOptions = {},
): Promise<t.PullTool.Bundle.Dist.Result> {
  const spinner = options.silent ? undefined : Cli.spinner();
  spinner?.start(Fmt.spinnerText('materializing checksum-pinned dist...'));

  try {
    const source = manifestSource(bundle.manifest);
    const canonicalBase = await Fs.realPath(baseDir) as t.StringDir;
    const storeDir = resolveWithin(canonicalBase, bundle.store, 'Dist store');
    const generation = await Dist.materialize({
      manifestUrl: source.href,
      integrity: bundle.integrity,
      storeDir,
      policy: materializePolicy(source.origin),
      until: options.until,
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

    if (!bundle.project) {
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
      generation.dir,
      bundle.project,
      options,
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

    const msg = `${c.green(generation.kind)} → ${c.cyan(bundle.project.dir)} (mutable projection)`;
    spinner?.succeed(Fmt.spinnerText(c.gray(msg)));
    return { ok: true, kind: 'dist', generation, projection };
  } finally {
    spinner?.stop();
  }
}

async function projectGeneration(
  baseDir: t.StringDir,
  generationDir: t.StringAbsoluteDir,
  project: t.PullTool.ConfigYaml.DistProject,
  options: t.PullTool.Bundle.RunOptions,
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

  if (isCancelled(options.until)) {
    return projectionFailure(dir, project.mode, 'cancelled', 'Dist projection cancelled.');
  }

  try {
    const rooted = await Fs.Capability.Rooted.create({ root: baseDir, until: options.until });
    await rooted.admit(
      [{ kind: 'directory', path: project.dir }],
      { until: options.until },
    );
  } catch (error) {
    const reason = isCancelled(options.until) ? 'cancelled' : 'invalid-target';
    return projectionFailure(dir, project.mode, reason, error);
  }

  if (isCancelled(options.until)) {
    return projectionFailure(dir, project.mode, 'cancelled', 'Dist projection cancelled.');
  }

  if (project.mode === 'create' && await Fs.exists(dir)) {
    return projectionFailure(
      dir,
      project.mode,
      'target-occupied',
      'Dist projection target is occupied.',
    );
  }

  try {
    if (project.mode === 'replace') await clearTargetDir({ baseDir, targetDir: dir });
    const copied = await Fs.copy(generationDir, dir, { throw: true });
    if (copied.error) throw copied.error;
  } catch (error) {
    return projectionFailure(dir, project.mode, 'filesystem-failure', error);
  }

  try {
    await rewriteProjectionTags(baseDir, dir);
  } catch (error) {
    return projectionFailure(dir, project.mode, 'rewrite-failure', error);
  }

  return { kind: 'projected', dir, mode: project.mode };
}

/** Bind Pull's fixed finite materialization authority to the configured manifest origin. */
function materializePolicy(origin: t.StringUrl): t.ServerDist.Policy {
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

function isCancelled(until?: t.UntilInput): boolean {
  const life = Rx.abortable(until);
  try {
    return life.signal.aborted;
  } finally {
    life.dispose();
  }
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

function formatMaterializationFailure(failure: t.ServerDist.Failed): string {
  return `Dist materialization failed: ${failure.stage}/${failure.reason}`;
}
