import { type t, Fs, Pkg } from '../common.ts';
import { rewriteHtml } from './u.url.rewrite.html.ts';

/**
 * Rewrite injected <base> tags from a public host to a local bundle-relative
 * base, and patch root-absolute asset URLs so they live under the local bundle
 * mount.
 *
 * This handles both:
 *
 *  • Root bundle:
 *      dist.json path:      "/dist.json" (or similar)
 *      bundleRootPath:      "/"
 *      local mount:         "/my-bundle"
 *
 *      "/styles.css"                → "/my-bundle/styles.css"
 *      "/libs/my-feature/..."       → "/my-bundle/libs/my-feature/..."
 *
 *  • Nested bundle:
 *      dist.json path:      "/bundles/my-bundle/dist.json"
 *      bundleRootPath:      "/bundles/my-bundle"
 *      local mount:         "/example"
 *
 *      "/bundles/my-bundle/pkg/entry.js" → "pkg/entry.js"
 */
export async function rewriteTags(
  baseDir: t.StringDir,
  bundle: t.ServeTool.DirBundleConfig,
  host: string,
) {
  const rootDir = Fs.join(baseDir, bundle.local.dir);

  // Derive the remote bundle root path from the dist URL.
  const distLocation = Pkg.Dist.location(bundle.remote.dist);
  const bundleRootPath = distLocation.root;

  const glob = Fs.glob(rootDir);
  const matches = await glob.find('**/index.html');

  await Promise.all(
    matches.map(async (file) => {
      const path = file.path as t.StringFile;
      const original = await Deno.readTextFile(path);
      const rewritten = rewriteHtml({
        html: original,
        path,
        rootDir,
        bundleDir: bundle.local.dir,
        bundleRootPath,
        host,
      });
      if (rewritten !== original) await Fs.write(path, rewritten);
    }),
  );
}
