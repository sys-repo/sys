import { type t, c, Cli, Err, Http, Url } from '../common.ts';
import { Fmt } from '../u.fmt.ts';
import { rewriteTags } from './u.pull.rewriteTags.ts';

/**
 * Pulls a remote `dist.json` bundle into a local directory using resilient HTTP fetch.
 * Designed for hostile networks: manifest → absolute URLs → mapped paths → retry-safe write.
 */
export async function pullRemoteBundle(
  baseDir: t.StringDir,
  bundle: t.ServeTool.DirBundleConfig,
): Promise<t.HttpPullToDirResult> {
  const spinner = Cli.spinner();
  const targetDir = `${baseDir}/${bundle.local.dir}`;
  const distUrl = Url.toCanonical(bundle.remote.dist);
  if (!distUrl.ok) throw new Error(`Invalid dist.json URL: ${distUrl.href}`);

  spinner.start(Fmt.spinnerText('pulling remote bundle...'));
  try {
    const result = await pullDir(distUrl.href, targetDir);
    const host = distUrl.toURL().host;

    await rewriteTags(baseDir, bundle, host);

    if (!result.ok) {
      spinner.fail(summarizePullFailure(result));
    } else {
      const fullpath = Fmt.prettyPath(targetDir);
      const path = `./${c.cyan(bundle.local.dir)}\n  ${fullpath}`;
      const msg = c.gray(`${c.green('bundle pulled')} → ${path}`);
      spinner.succeed(msg);
    }

    return result;
  } catch (error) {
    spinner.fail('bundle pull error');
    throw error;
  } finally {
    spinner.stop();
  }
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
async function pullDir(distUrl: t.StringUrl, targetDir: t.StringDir) {
  const dist = await pullDist(distUrl);
  const distUrlObj = new URL(distUrl);

  /**
   * Remote bundle root (the directory that contains dist.json).
   * Examples:
   *    '/app/bundles/driver' → '.../app/bundles/driver/dist.json'
   *    '/'                   → '.../dist.json' at host root
   */
  const bundleRootPath = distUrlObj.pathname.replace(/\/[^/]*$/, '');
  const relativeTo = bundleRootPath === '' ? '/' : bundleRootPath;

  // Base URL for resolving manifest paths (index.html, pkg/*, sw.js, etc).
  const baseUrl = new URL('.', distUrlObj);

  // Manifest paths → absolute URLs.
  const assetUrls = Object.keys(dist.hash.parts).map((p) => new URL(p, baseUrl).href);

  // Include dist.json itself so it’s cached alongside the assets.
  const urls = [distUrlObj.href, ...assetUrls];

  const dir = await Http.Pull.toDir(urls, targetDir, {
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

  return { ...dir, dist } as const;
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
