import { Fs, Str, type t } from './common.ts';

export function createGithubReleasePullPlan(args: {
  baseDir: t.StringDir;
  bundle: t.PullTool.ConfigYaml.GithubReleaseBundle;
  resolved: t.PullTool.GithubReleaseResolved;
}): t.GithubPull.ReleasePlanResult {
  const { baseDir, bundle, resolved } = args;
  if (resolved.assets.length === 0) {
    return { ok: false, error: `Release has no assets: ${resolved.release.tag}` };
  }

  const releaseDir = toSafeTagDir(resolved.release.tag);
  const targetRoot = Fs.join(baseDir, bundle.local.dir, releaseDir) as t.StringDir;
  const targetNames = resolveTargetNames(resolved.assets);

  return {
    ok: true,
    releaseDir,
    plan: {
      kind: 'github:release',
      targetRoot,
      entries: resolved.assets.map((asset, index) => ({
        source: asset.downloadUrl,
        relativePath: targetNames[index] as t.StringRelativePath,
        request: {
          kind: 'release-asset',
          repo: bundle.repo,
          assetId: asset.id,
          fallbackUrl: asset.downloadUrl,
        },
      })),
    },
  };
}

/**
 * Helpers:
 */
function resolveTargetNames(assets: readonly t.PullTool.GithubReleaseAsset[]): string[] {
  const counts = new Map<string, number>();
  return assets.map((asset, index) => {
    const name = toSafeAssetFilename(asset.name, index);
    const next = (counts.get(name) ?? 0) + 1;
    counts.set(name, next);
    return next === 1 ? name : appendFileSuffix(name, `-${next}`);
  });
}

function appendFileSuffix(filename: string, suffix: string): string {
  const i = filename.lastIndexOf('.');
  if (i <= 0) return `${filename}${suffix}`;
  return `${filename.slice(0, i)}${suffix}${filename.slice(i)}`;
}

function toSafeTagDir(value: string): string {
  const raw = String(value ?? '').trim();
  const pathSafe = Str.splitPathSegments(raw).join('-') || raw;
  const safe = pathSafe
    .replace(/[^A-Za-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return safe || 'release';
}

function toSafeAssetFilename(value: string, index: number): string {
  const raw = String(value ?? '').trim();
  const pathSafe = Str.splitPathSegments(raw).join('-') || raw;
  const safe = pathSafe
    .replace(/[:]+/g, '-')
    .replace(/[\u0000-\u001f]+/g, '')
    .replace(/\s+/g, ' ')
    .replace(/^-+|-+$/g, '')
    .trim();

  if (!safe || safe === '.' || safe === '..') return `asset-${index + 1}`;
  return safe;
}
