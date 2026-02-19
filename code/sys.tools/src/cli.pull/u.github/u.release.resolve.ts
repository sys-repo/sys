import { type t, Is } from '../common.ts';

/**
 * Resolve a github:release bundle down to concrete release + asset + distPath.
 * Pure selection logic only (no network calls).
 */
export function resolveGithubReleaseBundle(
  bundle: t.PullTool.ConfigYaml.GithubReleaseBundle,
  releases: readonly t.PullTool.GithubRelease[],
): t.PullTool.GithubReleaseResolveResult {
  const releaseRes = selectRelease(releases, bundle.tag);
  if (!releaseRes.ok) return releaseRes;

  const assetRes = selectAsset(releaseRes.data, bundle.asset);
  if (!assetRes.ok) return assetRes;

  return {
    ok: true,
    data: {
      release: releaseRes.data,
      asset: assetRes.data,
      distPath: resolveDistPath(bundle),
    },
  };
}

function selectRelease(
  releases: readonly t.PullTool.GithubRelease[],
  wantedTag?: string,
): { readonly ok: true; readonly data: t.PullTool.GithubRelease } | { readonly ok: false; readonly error: string } {
  if (releases.length === 0) {
    return { ok: false, error: 'No releases found for repository.' };
  }

  const tag = Is.str(wantedTag) ? wantedTag.trim() : '';
  if (tag) {
    const release = releases.find((m) => m.tag === tag);
    if (!release) {
      const available = releases.map((m) => m.tag).join(', ');
      return {
        ok: false,
        error: `Release tag not found: ${tag}${available ? ` (available: ${available})` : ''}`,
      };
    }
    return { ok: true, data: release };
  }

  const latestStable = releases.find((m) => !m.draft && !m.prerelease);
  return { ok: true, data: latestStable ?? releases[0] };
}

function selectAsset(
  release: t.PullTool.GithubRelease,
  wantedAsset?: string,
): { readonly ok: true; readonly data: t.PullTool.GithubReleaseAsset } | { readonly ok: false; readonly error: string } {
  const assets = release.assets;
  if (assets.length === 0) {
    return { ok: false, error: `Release has no assets: ${release.tag}` };
  }

  const assetName = Is.str(wantedAsset) ? wantedAsset.trim() : '';
  if (assetName) {
    const asset = assets.find((m) => m.name === assetName);
    if (!asset) {
      const available = assets.map((m) => m.name).join(', ');
      return {
        ok: false,
        error: `Release asset not found: ${assetName}${available ? ` (available: ${available})` : ''}`,
      };
    }
    return { ok: true, data: asset };
  }

  const defaultNames = [
    'bundle.tgz',
    'bundle.tar.gz',
    'bundle.zip',
    'dist.tgz',
    'dist.tar.gz',
    'dist.zip',
  ];
  for (const name of defaultNames) {
    const asset = assets.find((m) => m.name === name);
    if (asset) return { ok: true, data: asset };
  }

  if (assets.length === 1) {
    return { ok: true, data: assets[0] };
  }

  const archives = assets.filter((m) => isArchiveName(m.name));
  if (archives.length === 1) {
    return { ok: true, data: archives[0] };
  }

  return {
    ok: false,
    error: `Asset is ambiguous for release ${release.tag}; set bundle.asset explicitly.`,
  };
}

function resolveDistPath(bundle: t.PullTool.ConfigYaml.GithubReleaseBundle): t.StringPath {
  const dist = Is.str(bundle.dist) ? bundle.dist.trim() : '';
  return (dist || 'dist.json') as t.StringPath;
}

function isArchiveName(name: string): boolean {
  const lower = name.toLowerCase();
  return lower.endsWith('.tgz') || lower.endsWith('.tar.gz') || lower.endsWith('.zip');
}
