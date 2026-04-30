import { Is, type t } from './common.ts';

type SelectReleaseResult =
  | { readonly ok: true; readonly data: t.GithubSource.Release }
  | { readonly ok: false; readonly error: string };

type SelectAssetsResult =
  | { readonly ok: true; readonly data: readonly t.GithubSource.ReleaseAsset[] }
  | { readonly ok: false; readonly error: string };

/**
 * Resolve a github:release bundle down to concrete release + assets.
 * Pure selection logic only (no network calls).
 */
export function resolveGithubReleaseBundle(
  bundle: t.PullTool.ConfigYaml.GithubReleaseBundle,
  releases: readonly t.GithubSource.Release[],
): t.GithubSource.ReleaseResolveResult {
  const releaseRes = selectRelease(releases, bundle.tag);
  if (!releaseRes.ok) return releaseRes;

  const assetRes = selectAssets(releaseRes.data, bundle.asset);
  if (!assetRes.ok) return assetRes;

  return {
    ok: true,
    data: {
      release: releaseRes.data,
      assets: assetRes.data,
    },
  };
}

function selectRelease(
  releases: readonly t.GithubSource.Release[],
  wantedTag?: string,
): SelectReleaseResult {
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
  release: t.GithubSource.Release,
  wantedAsset?: string | string[],
): SelectAssetsResult {
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
          error: `Release asset not found: ${assetName}${
            available ? ` (available: ${available})` : ''
          }`,
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

    const selected: t.GithubSource.ReleaseAsset[] = [];
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
        error: `Release assets not found: ${missing.join(', ')}${
          available ? ` (available: ${available})` : ''
        }`,
      };
    }

    return { ok: true, data: selected };
  }

  return { ok: true, data: assets };
}
