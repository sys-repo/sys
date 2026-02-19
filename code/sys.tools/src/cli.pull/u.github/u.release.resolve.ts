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

  const assetRes = selectAssets(releaseRes.data, bundle.asset);
  if (!assetRes.ok) return assetRes;

  return {
    ok: true,
    data: {
      release: releaseRes.data,
      assets: assetRes.data,
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

function selectAssets(
  release: t.PullTool.GithubRelease,
  wantedAsset?: string | string[],
): { readonly ok: true; readonly data: readonly t.PullTool.GithubReleaseAsset[] } | { readonly ok: false; readonly error: string } {
  const assets = release.assets;
  if (assets.length === 0) {
    return { ok: false, error: `Release has no assets: ${release.tag}` };
  }

  if (Is.str(wantedAsset)) {
    const assetName = wantedAsset.trim();
    if (assetName) {
      const asset = assets.find((m) => m.name === assetName);
      if (!asset) {
        const available = assets.map((m) => m.name).join(', ');
        return {
          ok: false,
          error: `Release asset not found: ${assetName}${available ? ` (available: ${available})` : ''}`,
        };
      }
      return { ok: true, data: [asset] };
    }
  }

  if (Array.isArray(wantedAsset)) {
    const names = wantedAsset.map((m) => String(m ?? '').trim()).filter(Boolean);
    if (names.length === 0) {
      return { ok: false, error: 'Release asset list is empty; add at least one asset name.' };
    }

    const selected: t.PullTool.GithubReleaseAsset[] = [];
    const missing: string[] = [];

    for (const name of names) {
      const asset = assets.find((m) => m.name === name);
      if (!asset) missing.push(name);
      else selected.push(asset);
    }

    if (missing.length > 0) {
      const available = assets.map((m) => m.name).join(', ');
      return {
        ok: false,
        error: `Release assets not found: ${missing.join(', ')}${available ? ` (available: ${available})` : ''}`,
      };
    }

    return { ok: true, data: selected };
  }

  const selected = assets.filter((m) => !isGithubSourceArchive(m.name) && isSupportedArchive(m.name));
  if (selected.length === 0) {
    const available = assets
      .map((m) => m.name)
      .filter((m) => !isGithubSourceArchive(m))
      .join(', ');
    return {
      ok: false,
      error: `No supported archive assets found for ${release.tag}; set bundle.asset explicitly${available ? ` (available: ${available})` : ''}`,
    };
  }

  return { ok: true, data: selected };
}

function resolveDistPath(bundle: t.PullTool.ConfigYaml.GithubReleaseBundle): t.StringPath {
  const dist = Is.str(bundle.dist) ? bundle.dist.trim() : '';
  return (dist || 'dist.json') as t.StringPath;
}

function isGithubSourceArchive(name: string): boolean {
  return name === 'Source code (zip)' || name === 'Source code (tar.gz)';
}

function isSupportedArchive(name: string): boolean {
  const lower = name.toLowerCase();
  return lower.endsWith('.zip') || lower.endsWith('.tgz') || lower.endsWith('.tar.gz');
}
