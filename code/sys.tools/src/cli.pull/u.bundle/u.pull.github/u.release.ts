import { c, Cli, Pkg, type t } from './common.ts';
import { Fmt } from '../../u.fmt.ts';
import {
  downloadGithubAsset,
  downloadGithubAssetById,
  listGithubReleases,
  loadGithubToken,
} from '../../u.github/u.client.ts';
import { mapGithubError } from '../../u.github/u.errors.ts';
import { resolveGithubReleaseBundle } from '../../u.github/u.release.resolve.ts';
import { done, errorMessage, fail } from '../u.pull/u.result.ts';
import { executeGithubPullPlan } from './u.execute.ts';
import { createGithubReleasePullPlan } from './u.plan.ts';

export async function pullGithubReleaseBundle(
  baseDir: t.StringDir,
  bundle: t.PullTool.ConfigYaml.GithubReleaseBundle,
): Promise<t.PullToolRemoteBundleResult> {
  const spinner = Cli.spinner();
  const token = await loadGithubToken({ cwd: baseDir });

  try {
    spinner.start(Fmt.spinnerText('resolving github release...'));

    const releases = await listGithubReleases({ repo: bundle.repo, token });
    const resolved = resolveGithubReleaseBundle(bundle, releases);
    if (!resolved.ok) return fail(resolved.error);

    const planned = createGithubReleasePullPlan({ baseDir, bundle, resolved: resolved.data });
    if (!planned.ok) return fail(planned.error);

    const executed = await executeGithubPullPlan({
      baseDir,
      plan: planned.plan,
      clear: bundle.local.clear,
      download: createGithubDownloader(token),
      events: {
        clearing: () => {
          spinner.text = Fmt.spinnerText('clearing local target...');
        },
        entry: ({ entry, current, total }) => {
          const progress = total > 1 ? ` ${c.white(String(current))}/${total}` : '';
          spinner.text = Fmt.spinnerText(`downloading${progress} ${c.cyan(entry.relativePath)}...`);
        },
      },
    });

    if (!executed.ok) return fail(executed.error);

    const dist = await computeReleaseDist(planned.plan.targetRoot);
    const msgPulled = `${c.green('release pulled')} → ${
      c.cyan(`${bundle.local.dir}/${planned.releaseDir}`)
    } (${executed.ops.length} assets)`;
    spinner.succeed(Fmt.spinnerText(c.gray(msgPulled)));

    return done({
      ok: true,
      ops: executed.ops,
      dist,
      summary: {
        kind: 'github:release',
        repo: bundle.repo,
        release: resolved.data.release.tag,
      },
    });
  } catch (error) {
    const auth = mapGithubError(error, {
      kind: 'github:release',
      repo: bundle.repo,
      tag: bundle.tag,
      asset: Array.isArray(bundle.asset) ? bundle.asset.join(', ') : bundle.asset,
    });
    return fail(auth ?? errorMessage(error));
  } finally {
    spinner.stop();
  }
}

export async function computeReleaseDist(dir: t.StringDir): Promise<t.DistPkg> {
  const computed = await Pkg.Dist.compute({ dir, save: true });
  if (computed.error) throw computed.error;
  return computed.dist;
}

/**
 * Helpers:
 */
function createGithubDownloader(token?: string): t.GithubPull.Downloader {
  return async (request) => await downloadGithubAssetWithFallback({ request, token });
}

async function downloadGithubAssetWithFallback(args: {
  request: t.GithubPull.DownloadRequest;
  token?: string;
}): Promise<Uint8Array> {
  const { request, token } = args;
  if (request.kind !== 'release-asset') {
    throw new Error(`Unsupported GitHub release download request: ${request.kind}`);
  }

  try {
    return await downloadGithubAssetById({
      repo: request.repo,
      assetId: request.assetId,
      token,
    });
  } catch {
    return await downloadGithubAsset({
      url: request.fallbackUrl,
      token,
    });
  }
}
