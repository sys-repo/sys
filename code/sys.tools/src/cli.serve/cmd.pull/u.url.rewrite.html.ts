import type { t } from '../common.ts';
import { rewriteAssetUrls } from './u.url.rewrite.assetUrls.ts';
import { computeBaseHref } from './u.url.computeBaseHref.ts';

type RewriteArgs = {
  html: string;
  path: t.StringFile;
  rootDir: t.StringDir;
  bundleDir: string; //       e.g. "my-bundle", "site"
  bundleRootPath: string; //  e.g. "/", "/bundles/my-bundle"
  host: string; //            e.g. "example.com"
};

/**
 * Transform a pulled HTML file:
 *
 *  1. Rewrite <base> from https://<host>/... → local bundle-relative base.
 *  2. Rewrite root-absolute href/src ("/...") into bundle-correct paths:
 *
 *    Root bundle (bundleRootPath === "/"):
 *      "/styles.css"                  → "/my-bundle/styles.css"
 *      "/libs/my-feature/..."         → "/my-bundle/libs/my-feature/..."
 *
 *    Nested bundle (bundleRootPath === "/bundles/my-bundle"):
 *      "/bundles/my-bundle/pkg/entry.js" → "pkg/entry.js"
 *
 *  No knowledge of any particular app or bundle naming is baked in;
 *  everything is driven by bundleRootPath and bundleDir.
 */
export function rewriteHtml(args: RewriteArgs): string {
  const { path, rootDir, bundleDir, bundleRootPath } = args;
  let { html } = args;

  /*
   * 1) Rewrite <base href="https://<host>/..."> → local absolute path.
   *    We only touch <base> tags that point at the given host.
   */
  {
    const escapedDomain = args.host.replace(/\./g, '\\.');
    const basePattern = `<base[^>]*href=(["'])https:\\/\\/${escapedDomain}[^"']*\\1[^>]*>`;
    const baseRx = new RegExp(basePattern, 'gi');
    if (baseRx.test(html)) {
      const basePath = computeBaseHref(rootDir, path, bundleDir);
      const replacement = `<base href="${basePath}">`;
      html = html.replace(baseRx, replacement);
    }
  }

  /*
   * 2) Rewrite root-absolute asset URLs.
   */
  html = rewriteAssetUrls(html, bundleDir, bundleRootPath);
  return html;
}
