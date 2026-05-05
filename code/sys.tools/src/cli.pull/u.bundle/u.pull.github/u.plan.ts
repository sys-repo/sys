import { Fs, Str, type t } from './common.ts';

export function createGithubReleasePullPlan(args: {
  baseDir: t.StringDir;
  bundle: t.PullTool.ConfigYaml.GithubReleaseBundle;
  resolved: t.GithubSource.ReleaseResolved;
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

export function createGithubRepoPullPlan(args: {
  baseDir: t.StringDir;
  bundle: t.PullTool.ConfigYaml.GithubRepoBundle;
  resolved: t.GithubSource.RepoResolved;
}): t.GithubPull.RepoPlanResult {
  const { baseDir, bundle, resolved } = args;
  if (resolved.entries.length === 0) {
    return { ok: false, error: 'GitHub repo contains no materializable files.' };
  }

  const targetRoot = Fs.join(baseDir, bundle.local.dir) as t.StringDir;
  return {
    ok: true,
    plan: {
      kind: 'github:repo',
      targetRoot,
      entries: resolved.entries.map((entry) => {
        const source = githubBlobUrl(resolved.repo, resolved.ref, entry.sourcePath);
        return {
          source,
          relativePath: entry.relativePath,
          size: entry.size,
          request: {
            kind: 'repo-blob',
            repo: resolved.repo,
            ref: resolved.ref,
            sha: entry.sha,
            path: entry.sourcePath,
            url: entry.url ?? source,
          },
        };
      }),
    },
  };
}

/**
 * Helpers:
 */
function githubBlobUrl(repo: string, ref: string, path: string): t.StringUrl {
  const refPart = encodeURIComponent(ref);
  const pathPart = Str.splitPathSegments(path).map((segment) => encodeURIComponent(segment)).join(
    '/',
  );
  return `https://github.com/${repo}/blob/${refPart}/${pathPart}` as t.StringUrl;
}

function resolveTargetNames(assets: readonly t.GithubSource.ReleaseAsset[]): string[] {
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
  const safe = stripControlChars(pathSafe)
    .replace(/[:]+/g, '-')
    .replace(/\s+/g, ' ')
    .replace(/^-+|-+$/g, '')
    .trim();

  if (!safe || safe === '.' || safe === '..') return `asset-${index + 1}`;
  return safe;
}

function stripControlChars(input: string): string {
  let output = '';
  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    if (char && char.charCodeAt(0) > 0x1f) output += char;
  }
  return output;
}
