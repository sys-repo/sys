import { type t } from '../common.ts';

/**
 * Compute the correct <base href="..."> path for a given HTML file
 * under a local bundle root.
 *
 * Example:
 *   rootDir:   "/.../.tmp/my-bundle"
 *   filePath:  "/.../.tmp/my-bundle/app/example/index.html"
 *   bundleDir: "my-bundle"
 *
 *   → "/my-bundle/app/example/"
 */
export function computeBaseHref(
  rootDir: t.StringDir,
  filePath: t.StringFile,
  bundleDir: string,
): string {
  const normalizedRoot = rootDir.endsWith('/') ? rootDir.slice(0, -1) : rootDir;

  // Strip the bundle root dir from the file path to get a relative directory.
  let withoutRoot = filePath.slice(normalizedRoot.length); // eg. "/app/example/index.html"
  if (withoutRoot.startsWith('/')) withoutRoot = withoutRoot.slice(1);

  const withoutIndex = withoutRoot.replace(/index\.html$/i, '');
  const relDir = withoutIndex.replace(/\/$/, ''); // eg. "" or "app/example" or "modules/widget"

  return relDir ? `/${bundleDir}/${relDir}/` : `/${bundleDir}/`;
}
