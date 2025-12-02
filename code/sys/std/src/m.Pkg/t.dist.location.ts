import type { t } from './common.ts';

/**
 * Pure constructor for a `PkgDistLocation` from either:
 *
 *  - a URL/href pointing at a `dist.json` file, or
 *  - a directory-like root path.
 *
 * Overload behaviour:
 *  - URL/href input → `PkgDistLocationUrl`
 *  - dir/path input → `PkgDistLocationDir`
 *
 * This is path/URL normalization only; no I/O or fetching.
 */
export type PkgDistAsLocation = {
  (href: t.StringUrl | URL | t.HttpUrl): PkgDistLocationUrl;
  (dir: t.StringDir | t.StringPath): PkgDistLocationDir;
};

/**
 * Normalized root of a distribution bundle.
 *
 * This describes the logical root directory of a dist package,
 * independent of whether it is anchored at a URL or a filesystem path.
 *
 * - `root` is always an absolute path for the bundle root.
 * - `segments` is the split path (no leading slash).
 * - `is.root` flags if this is the top-level root ("/").
 */
export type PkgDistRoot = {
  readonly root: t.StringPath; //       ← "/", "/sys/driver.module", "/foo/bar"
  readonly segments: t.ObjectPath; //   ← [], ["sys","driver.module"]
  readonly is: {
    readonly root: boolean; //          ← root === "/"
  };
};

/**
 * Anchored location of a distribution bundle.
 *
 * A `PkgDistLocation` is a `PkgDistRoot` plus either:
 *  - URL anchor (`kind: "url"`)
 *  - directory anchor (`kind: "dir"`).
 *
 * Code that only cares about root geometry can use the shared
 * `PkgDistRoot` fields, while URL/dir-specific logic can narrow
 * on `kind`.
 */
export type PkgDistLocation = PkgDistLocationUrl | PkgDistLocationDir;

/**
 * Distribution bundle rooted at a URL.
 *
 * Represents a dist whose root directory is anchored at a remote origin.
 * The `pathname` is the full path to the `dist.json` file, while
 * `root` (from `PkgDistRoot`) is the directory that contains it.
 */
export type PkgDistLocationUrl = PkgDistRoot & {
  readonly kind: 'url';
  readonly href: t.StringUrl; //     ← "https://example.com/sys/driver.module/dist.json"
  readonly origin: string; //        ← "https://example.com"
  readonly host: string; //          ← "example.com"
  readonly protocol: string; //      ← "https:"
  readonly pathname: string; //      ← "/sys/driver.module/dist.json"
};

/**
 * Distribution bundle rooted at a directory path.
 *
 * Represents a dist whose root directory is anchored at a
 * directory-like path (typically a local filesystem mount),
 * using the same `root`/`segments` geometry as the URL variant.
 */
export type PkgDistLocationDir = PkgDistRoot & {
  readonly kind: 'dir';
  readonly dir: t.StringDir; //      ← "/.../.tmp/dev" or "/.../.tmp/dev/module"
};
