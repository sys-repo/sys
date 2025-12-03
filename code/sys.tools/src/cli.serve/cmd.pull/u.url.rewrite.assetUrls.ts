/**
 * Rewrite root-absolute asset URLs:
 *
 *  • Root bundle (bundleRootPath === "/"):
 *      "/something" → "/<bundleDir>/something"
 *
 *  • Nested bundle (for example "/bundles/my-bundle"):
 *      only if the path starts with the bundleRootPath:
 *        "/bundles/my-bundle/pkg/entry.js" → "pkg/entry.js"
 *
 *  Other absolute paths (e.g. to a different bundle root) are left untouched.
 */
export function rewriteAssetUrls(html: string, bundleDir: string, bundleRootPath: string): string {
  const assetRx = /(href|src)=(["'])(\/[^"']*)\2/g;
  const isRootBundle = bundleRootPath === '/' || bundleRootPath === '';
  const rootPrefix = bundleRootPath.endsWith('/') ? bundleRootPath : `${bundleRootPath}/`;

  return html.replace(assetRx, (match, attr, quote, fullPath) => {
    // Root bundle: re-root everything under "/<bundleDir>", but
    // avoid double-prefixing if it's already there ("/my-bundle/...").
    if (isRootBundle) {
      if (fullPath === `/${bundleDir}` || fullPath.startsWith(`/${bundleDir}/`)) {
        // Already correctly rooted; leave as-is.
        return match;
      }

      const newPath = `/${bundleDir}${fullPath}`;
      return `${attr}=${quote}${newPath}${quote}`;
    }

    // Nested bundle: only rewrite assets that live under this bundle's root path.
    if (!fullPath.startsWith(rootPrefix)) {
      // Different root; leave untouched.
      return match;
    }

    // Strip the bundle root to produce a relative path.
    // e.g. fullPath:  "/bundles/my-bundle/pkg/entry.js"
    //      rootPrefix:"/bundles/my-bundle/"
    //      → "pkg/entry.js"
    const trimmed = fullPath.slice(rootPrefix.length);
    return `${attr}=${quote}${trimmed}${quote}`;
  });
}
