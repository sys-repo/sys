import { type t, c, Cli, Err, Fs, Http, Pkg, Str, Url } from '../common.ts';
import {
  downloadGithubAsset,
  downloadGithubAssetById,
  listGithubReleases,
  loadGithubToken,
} from '../u.github/u.client.ts';
import { resolveGithubReleaseBundle } from '../u.github/u.release.resolve.ts';
import {
  assertSafeDistPath,
  extractArchive,
  mapAuthError,
  resolveDistFile,
} from '../u.github/u.release.fs.ts';
import { Fmt as BaseFmt } from '../u.fmt.ts';
import { createMonotonicProgress } from './u.monotonicProgress.ts';
import { rewriteTags } from './u.pull.rewriteTags.ts';

type Progress = { index: t.Index; total: number };
type PullHttp = (
  baseDir: t.StringDir,
  bundle: t.PullTool.ConfigYaml.HttpBundle,
) => Promise<t.PullToolRemoteBundleResult>;
type PullGithubRelease = (
  baseDir: t.StringDir,
  bundle: t.PullTool.ConfigYaml.GithubReleaseBundle,
) => Promise<t.PullToolRemoteBundleResult>;
type Pullers = {
  pullHttp: PullHttp;
  pullGithubRelease: PullGithubRelease;
};

const Fmt = {
  ...BaseFmt,
  bundleSize(dist: t.DistPkg) {
    return Str.bytes(dist.build.size.total);
  },

  pullingSpinnerText(opts: { dist?: t.DistPkg; progress?: Progress } = {}) {
    const { dist, progress } = opts;
    const a: string[] = [];

    if (dist) a.push(Fmt.bundleSize(dist));

    if (progress) {
      const curr = progress.index + 1;
      const done = curr >= progress.total;
      const indexText = done ? c.green(String(curr)) : c.white(String(curr));
      a.push(`${indexText}/${progress.total} files`);
    }

    const after = a.length === 0 ? '' : `(${a.join(' · ')})`;
    return Fmt.spinnerText(`pulling remote bundle... ${after}`.trim());
  },
} as const;

/**
 * Pulls a remote `dist.json` bundle into a local directory using resilient HTTP fetch.
 * Designed for hostile networks: manifest → absolute URLs → mapped paths → retry-safe write.
 */
export async function pullRemoteBundle(
  baseDir: t.StringDir,
  bundle: t.PullTool.ConfigYaml.Bundle,
  pullers: Pullers = {
    pullHttp: pullHttpBundle,
    pullGithubRelease: pullGithubReleaseBundle,
  },
): Promise<t.PullToolRemoteBundleResult> {
  try {
    if (bundle.kind === 'http') return pullers.pullHttp(baseDir, bundle);
    if (bundle.kind === 'github:release') return pullers.pullGithubRelease(baseDir, bundle);
    const _never: never = bundle;
    return fail(`Unknown bundle kind: ${String(_never)}`);
  } catch (error) {
    return fail(errorMessage(error));
  }
}

async function pullHttpBundle(
  baseDir: t.StringDir,
  bundle: t.PullTool.ConfigYaml.HttpBundle,
): Promise<t.PullToolRemoteBundleResult> {
  const spinner = Cli.spinner();
  const targetDir = `${baseDir}/${bundle.local.dir}`;
  const distUrl = Url.toCanonical(bundle.dist);
  if (!distUrl.ok) return fail(`Invalid dist.json URL: ${distUrl.href}`);

  // Pull `dist.json` manifest:
  spinner.start(Fmt.pullingSpinnerText());
  const dist = await pullDist(distUrl.href);

  const updateSpinnerText = (progress?: Progress) => Fmt.pullingSpinnerText({ dist, progress });
  const updateSpinner = (progress?: Progress) => (spinner.text = updateSpinnerText(progress));
  updateSpinner();

  const toMonotonic = createMonotonicProgress();
  const onStream = (e: t.HttpPullEvent) => {
    // Stream events may regress (retries / mixed event kinds).
    // Clamp display to a monotonic incrementing view.
    const next = toMonotonic(e.index, e.total);
    updateSpinner({ index: next.shownIndex as t.Index, total: next.total });
  };

  // Pull folder from manifest:
  try {
    const result = await pullDir(distUrl.href, targetDir, { dist, onStream });
    await rewriteTags(baseDir, bundle);

    if (!result.ok) {
      const error = summarizePullFailure(result);
      spinner.fail(error);
      return fail(error);
    } else {
      const size = c.dim(`(${Fmt.bundleSize(dist)})`);
      const fullpath = Fmt.prettyPath(targetDir);
      const path = `./${c.cyan(bundle.local.dir)} ${size}\n  ${fullpath}`;
      const msg = c.gray(`${c.green('bundle pulled')} → ${path}`);
      spinner.succeed(msg);
    }

    return done({
      ...result,
      dist,
      get ops() {
        return result.ops;
      },
    });
  } catch (error) {
    spinner.fail('bundle pull error');
    return fail(errorMessage(error));
  } finally {
    spinner.stop();
  }
}

async function pullGithubReleaseBundle(
  baseDir: t.StringDir,
  bundle: t.PullTool.ConfigYaml.GithubReleaseBundle,
): Promise<t.PullToolRemoteBundleResult> {
  const spinner = Cli.spinner();
  const tmp = await Fs.makeTempDir({ prefix: 'pull-github-release-' });
  const token = await loadGithubToken();

  try {
    if (!token) {
      return fail(
        [
          'GitHub token not found.',
          'Set GH_TOKEN (or GITHUB_TOKEN) to pull github:release bundles.',
          githubTokenHelpText(),
        ].join('\n'),
      );
    }

    spinner.start(Fmt.spinnerText('resolving github release...'));

    const releases = await listGithubReleases({ repo: bundle.repo, token });
    const resolved = resolveGithubReleaseBundle(bundle, releases);
    if (!resolved.ok) return fail(resolved.error);

    const { assets, distPath: rawDistPath } = resolved.data;
    const distPath = assertSafeDistPath(rawDistPath);
    const ops: Array<t.PullToolBundleResult['ops'][number]> = [];
    const dists: t.DistPkg[] = [];
    const normalizedDistPath = distPath.replaceAll('\\', '/');
    const targetDirs = resolveGithubAssetTargetDirs(baseDir, bundle.local.dir, assets);

    for (const [index, asset] of assets.entries()) {
      const targetDir = targetDirs[index];
      const source = asset.downloadUrl;
      const total = assets.length;
      const progress = total > 1 ? ` ${index + 1}/${total}` : '';

      try {
        spinner.text = Fmt.spinnerText(`downloading${progress} ${c.cyan(asset.name)}...`);
        const bytes = await downloadGithubAssetWithFallback({
          repo: bundle.repo,
          assetId: asset.id,
          url: source,
          token,
        });

        spinner.text = Fmt.spinnerText(`extracting${progress} ${c.cyan(asset.name)}...`);
        const assetDir = Fs.join(tmp.absolute, `asset-${index + 1}`);
        const archivePath = Fs.join(assetDir, asset.name);
        const extractDir = Fs.join(assetDir, 'extract');
        await Fs.ensureDir(assetDir);
        await Fs.write(archivePath, bytes, { force: true });
        await extractArchive({ archivePath, outputDir: extractDir as t.StringDir });

        spinner.text = Fmt.spinnerText(`resolving dist${progress} ${c.cyan(asset.name)}...`);
        const distFile = await resolveDistFile({
          extractedDir: extractDir as t.StringDir,
          distPath,
        });
        const bundleRoot = Fs.dirname(distFile) as t.StringDir;

        spinner.text = Fmt.spinnerText(`syncing${progress} ${c.cyan(asset.name)}...`);
        await Fs.remove(targetDir, { log: false });
        await Fs.copy(bundleRoot, targetDir, { force: true });

        const readDist = await Fs.readJson<t.DistPkg>(Fs.join(targetDir, normalizedDistPath));
        if (!readDist.ok || !readDist.data || !Pkg.Is.dist(readDist.data)) {
          throw new Error('Invalid dist.json in pulled release bundle.');
        }

        dists.push(readDist.data);
        ops.push({
          ok: true,
          path: { source, target: targetDir },
          bytes: bytes.byteLength,
        });
      } catch (error) {
        ops.push({
          ok: false,
          path: { source, target: targetDir },
          error: errorMessage(error),
        });
      }
    }

    const failed = ops.filter((m) => !m.ok);
    if (failed.length > 0) {
      return fail(summarizeGithubPullFailures(failed, ops.length));
    }
    if (dists.length === 0) {
      return fail('No release assets were pulled.');
    }

    await rewriteTags(baseDir, bundle);

    const path = c.gray(`${c.green('bundle pulled')} → ${c.cyan(bundle.local.dir)} (${ops.length} assets)`);
    spinner.succeed(path);

    return done({
      ok: true,
      dist: dists[0],
      dists,
      ops,
    });
  } catch (error) {
    const auth = mapAuthError(error);
    return fail(auth ?? errorMessage(error));
  } finally {
    spinner.stop();
    await Fs.remove(tmp.absolute, { log: false });
  }
}

async function downloadGithubAssetWithFallback(args: {
  repo: string;
  assetId: number;
  url: t.StringUrl;
  token: string;
}): Promise<Uint8Array> {
  try {
    return await downloadGithubAssetById({
      repo: args.repo,
      assetId: args.assetId,
      token: args.token,
    });
  } catch {
    return await downloadGithubAsset({
      url: args.url,
      token: args.token,
    });
  }
}

function resolveGithubAssetTargetDirs(
  baseDir: t.StringDir,
  localDir: t.StringRelativeDir,
  assets: readonly t.PullTool.GithubReleaseAsset[],
): t.StringDir[] {
  const root = `${baseDir}/${localDir}`;
  if (assets.length <= 1) return [root as t.StringDir];

  const keys = resolveAssetKeys(assets);
  return keys.map((key) => `${root}/${key}` as t.StringDir);
}

function resolveAssetKeys(assets: readonly t.PullTool.GithubReleaseAsset[]): string[] {
  const counts = new Map<string, number>();
  return assets.map((asset, index) => {
    const base = toAssetKey(asset.name, index);
    const next = (counts.get(base) ?? 0) + 1;
    counts.set(base, next);
    return next === 1 ? base : `${base}-${next}`;
  });
}

function toAssetKey(name: string, index: number): string {
  const trimmed = String(name ?? '').trim();
  const withoutExt = trimmed
    .replace(/\.tar\.gz$/i, '')
    .replace(/\.tgz$/i, '')
    .replace(/\.zip$/i, '')
    .replace(/\.[A-Za-z0-9]+$/g, '');
  const safe = withoutExt.replace(/[^A-Za-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '');
  return safe || `asset-${index + 1}`;
}

function done(data: t.PullToolBundleResult): t.PullToolRemoteBundleResult {
  return { ok: true, data };
}

function fail(error: string): t.PullToolRemoteBundleResult {
  return { ok: false, error };
}

function errorMessage(error: unknown): string {
  if (Err.Is.error(error)) return String(error.message ?? '').trim() || 'Bundle pull failed';
  return String(error ?? '').trim() || 'Bundle pull failed';
}

function githubTokenHelpText() {
  return [
    'Required permissions:',
    '- Fine-grained PAT: repository access + Contents: Read',
    '- Create/manage token: https://github.com/settings/personal-access-tokens',
  ].join('\n');
}

/**
 * Internal helpers:
 */

async function pullDist(distUrl: t.StringUrl): Promise<t.DistPkg> {
  const client = Http.client();
  const r = await client.json<t.DistPkg>(distUrl);
  if (!r.ok) throw Err.std('dist.json fetch failed', { cause: r.error });
  return r.data!;
}

/**
 * Pull all files listed in the dist manifest into `targetDir`.
 * The directory containing `dist.json` is treated as the remote bundle root.
 */
async function pullDir(
  distUrl: t.StringUrl,
  targetDir: t.StringDir,
  opts: { dist?: t.DistPkg; onStream?: (e: t.HttpPullEvent) => void } = {},
) {
  const dist = opts.dist ?? (await pullDist(distUrl));
  const distUrlObj = new URL(distUrl);

  /**
   * Remote bundle root (the directory that contains dist.json).
   * Examples:
   *    '/app/bundles/driver' → '.../app/bundles/driver/dist.json'
   *    '/'                   → '.../dist.json' at host root
   */
  const bundleRootPath = Str.stripTrailingPathSegment(distUrlObj.pathname);
  const relativeTo = bundleRootPath === '' ? '/' : bundleRootPath;

  // Base URL for resolving manifest paths (index.html, pkg/*, sw.js, etc).
  const baseUrl = new URL('.', distUrlObj);

  // Manifest paths → absolute URLs.
  const assetUrls = Object.keys(dist.hash.parts).map((p) => new URL(p, baseUrl).href);

  // Include dist.json itself so it's cached alongside the assets.
  const urls = [distUrlObj.href, ...assetUrls];

  const stream = Http.Pull.stream(urls, targetDir, {
    retry: { attempts: 8, base: 200, factor: 2, jitter: true },
    map: {
      /**
       * Strip the bundle root from the URL pathname so files land
       * relative to `targetDir`, matching the manifest paths.
       *
       * Example:
       *   pathname: '/app/bundles/driver/index.html'
       *   relativeTo: '/app/bundles/driver'
       *   → 'index.html'
       */
      relativeTo,
    },
  });

  for await (const ev of stream) {
    opts.onStream?.(ev);
  }

  return stream.done;
}

/**
 * Summarise a failed pull into a single CLI-friendly message.
 */
function summarizePullFailure(result: t.HttpPullToDirResult): string {
  const failed = result.ops.filter((op) => !op.ok);
  const total = result.ops.length;

  if (!failed.length) return 'bundle pull failed';

  const first = failed[0];
  const parts: string[] = [];

  parts.push(
    failed.length === 1
      ? `bundle pull failed (1/${total} files)`
      : `bundle pull failed (${failed.length}/${total} files)`,
  );

  parts.push(`source: ${first.path.source}`);

  if (first.status) parts.push(`status ${first.status}`);
  if (first.error) parts.push(first.error);

  return parts.join('\n - ');
}

function summarizeGithubPullFailures(
  failed: readonly t.PullToolBundleResult['ops'][number][],
  total: number,
): string {
  const first = failed[0];
  if (!first) return 'release pull failed';

  const parts: string[] = [];
  parts.push(
    failed.length === 1
      ? `release pull failed (1/${total} assets)`
      : `release pull failed (${failed.length}/${total} assets)`,
  );
  parts.push(`source: ${first.path.source}`);
  if (first.error) parts.push(first.error);
  return parts.join('\n - ');
}
