import { Fs, Str, type t } from './common.ts';
import { clearTargetDir } from '../u.pull/u.clearTargetDir.ts';
import { errorMessage } from '../u.pull/u.result.ts';

type PreparedEntry = {
  readonly entry: t.GithubPull.Entry;
  readonly target: t.StringPath;
};

type PreflightResult =
  | {
    readonly ok: true;
    readonly targetRoot: t.StringDir;
    readonly entries: readonly PreparedEntry[];
  }
  | { readonly ok: false; readonly error: string };

type RelativePathResult =
  | { readonly ok: true; readonly segments: readonly string[] }
  | { readonly ok: false; readonly error: string };

export async function executeGithubPullPlan(args: {
  baseDir: t.StringDir;
  plan: t.GithubPull.Plan;
  clear?: boolean;
  download: t.GithubPull.Downloader;
  events?: t.GithubPull.ExecuteEvents;
}): Promise<t.GithubPull.ExecuteResult> {
  const preflight = preparePlan(args.baseDir, args.plan);
  if (!preflight.ok) return { ok: false, ops: [], error: preflight.error };

  if (args.clear === true) {
    args.events?.clearing?.(preflight.targetRoot);
    await clearTargetDir({ baseDir: args.baseDir, targetDir: preflight.targetRoot });
  }

  await Fs.ensureDir(preflight.targetRoot);

  const ops: Array<t.PullToolBundleResult['ops'][number]> = [];
  const total = preflight.entries.length;

  for (const [index, item] of preflight.entries.entries()) {
    args.events?.entry?.({ entry: item.entry, current: index + 1, total });

    try {
      const bytes = await args.download(item.entry.request);
      await Fs.ensureDir(Fs.dirname(item.target));
      await Fs.write(item.target, bytes, { force: true });
      ops.push({
        ok: true,
        path: { source: item.entry.source, target: item.target },
        bytes: bytes.byteLength,
      });
    } catch (error) {
      ops.push({
        ok: false,
        path: { source: item.entry.source, target: item.target },
        error: errorMessage(error),
      });
      break;
    }
  }

  const failed = ops.filter((op) => !op.ok);
  if (failed.length > 0) {
    return { ok: false, ops, error: summarizeFailures(args.plan.kind, failed, total) };
  }
  return { ok: true, ops };
}

/**
 * Helpers:
 */
function preparePlan(baseDir: t.StringDir, plan: t.GithubPull.Plan): PreflightResult {
  const base = Fs.Path.resolve(baseDir);
  const targetRoot = Fs.Path.resolve(plan.targetRoot) as t.StringDir;
  if (!isInside(base, targetRoot)) {
    return { ok: false, error: `GitHub pull target must be inside pull base: ${targetRoot}` };
  }

  const entries: PreparedEntry[] = [];
  for (const entry of plan.entries) {
    const path = normalizeRelativePath(entry.relativePath);
    if (!path.ok) return { ok: false, error: path.error };

    const target = Fs.join(targetRoot, ...path.segments) as t.StringPath;
    const resolvedTarget = Fs.Path.resolve(target) as t.StringPath;
    if (!isInside(targetRoot, resolvedTarget)) {
      return {
        ok: false,
        error: `GitHub pull entry escapes target root: ${entry.relativePath}`,
      };
    }

    entries.push({ entry, target: resolvedTarget });
  }

  return { ok: true, targetRoot, entries };
}

function normalizeRelativePath(input: t.StringRelativePath): RelativePathResult {
  const raw = String(input ?? '');
  const trimmed = raw.trim();
  if (!trimmed) return { ok: false, error: 'GitHub pull entry path is empty.' };
  if (Fs.Path.Is.absolute(trimmed as t.StringPath) || trimmed.startsWith('\\')) {
    return { ok: false, error: `GitHub pull entry path must be relative: ${raw}` };
  }
  if (/^[A-Za-z]:/.test(trimmed)) {
    return { ok: false, error: `GitHub pull entry path must not use a drive prefix: ${raw}` };
  }
  if (hasControlChar(trimmed)) {
    return { ok: false, error: `GitHub pull entry path contains control characters: ${raw}` };
  }

  const segments = Str.splitPathSegments(trimmed);
  if (segments.length === 0) return { ok: false, error: 'GitHub pull entry path is empty.' };

  const bad = segments.find((segment) => segment === '.' || segment === '..');
  if (bad) return { ok: false, error: `GitHub pull entry path contains invalid segment: ${raw}` };

  return { ok: true, segments };
}

function hasControlChar(input: string): boolean {
  for (let i = 0; i < input.length; i++) {
    if (input.charCodeAt(i) <= 0x1f) return true;
  }
  return false;
}

function isInside(parent: t.StringPath, child: t.StringPath): boolean {
  const rel = Fs.Path.relative(parent, child).replaceAll('\\', '/');
  return rel.length > 0 && rel !== '.' && rel !== '..' && !rel.startsWith('../');
}

function summarizeFailures(
  kind: t.GithubPull.PlanKind,
  failed: readonly t.PullToolBundleResult['ops'][number][],
  total: number,
): string {
  const first = failed[0];
  if (!first) return 'GitHub pull failed';

  const parts: string[] = [];
  const noun = kind === 'github:release' ? 'assets' : 'files';
  const label = kind === 'github:release' ? 'release pull' : 'repo pull';
  parts.push(
    failed.length === 1
      ? `${label} failed (1/${total} ${noun})`
      : `${label} failed (${failed.length}/${total} ${noun})`,
  );
  parts.push(`source: ${first.path.source}`);
  if (first.error) parts.push(first.error);
  return parts.join('\n - ');
}
