import { type t, Cli, Err, Http } from '../common.ts';
import { Fmt } from '../u.fmt.ts';

export async function pullRemoteBundle(
  baseDir: t.StringDir,
  bundle: t.ServeTool.DirBundleConfig,
): Promise<t.HttpPullToDirResult> {
  const spinner = Cli.spinner();
  const targetDir = `${baseDir}/${bundle.local.dir}`;
  const distUrl = bundle.remote.dist;

  spinner.start(Fmt.spinnerText(`pulling remote bundle...`));
  try {
    const result = await pullDir(distUrl, targetDir);
    if (!result.ok) {
      spinner.fail('bundle pull failed');
    } else {
      spinner.succeed(`bundle pulled → ${targetDir}`);
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
 * Internal helpers.
 */

async function pullDist(distUrl: t.StringUrl) {
  const client = Http.client();
  const r = await client.json<t.DistPkg>(distUrl);
  if (!r.ok) throw Err.std(`dist.json fetch failed`, { cause: r.error });
  return r.data!;
}

/**
 * Pull all files listed in the dist manifest into `targetDir`.
 * The folder that contains `dist.json` is treated as the remote bundle root.
 */
async function pullDir(distUrl: t.StringUrl, targetDir: t.StringDir) {
  const dist = await pullDist(distUrl);
  const distUrlObj = new URL(distUrl);

  // Remote directory that contains dist.json (the bundle root).
  // Examples:
  //   "/app/bundles/driver" → for ".../app/bundles/driver/dist.json"
  //   "/"                   → for ".../dist.json" at the host root
  const bundleRootPath = distUrlObj.pathname.replace(/\/[^/]*$/, '');
  const relativeTo = bundleRootPath === '' ? '/' : bundleRootPath;

  // Base URL for resolving paths from the manifest (index.html, pkg/*, sw.js, etc).
  const baseUrl = new URL('.', distUrlObj);

  // Turn manifest paths into absolute URLs.
  const assetUrls = Object.keys(dist.hash.parts).map((p) => new URL(p, baseUrl).href);

  // Include dist.json itself in the pull so it’s cached alongside the assets.
  const urls = [distUrlObj.href, ...assetUrls];

  return await Http.Pull.toDir(urls, targetDir, {
    map: {
      // Strip the bundle root from the URL pathname so files land
      // relative to `targetDir`, matching the paths in the manifest.
      //
      // Example:
      //   pathname: "/app/bundles/driver/index.html"
      //   relativeTo: "/app/bundles/driver"
      //   → "index.html"
      relativeTo,
    },
  });
}
