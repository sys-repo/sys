import type { t } from './common.ts';

/**
 * Reverse proxy server.
 *
 * Design notes:
 * - Local bundle mounts are modeled as path-prefix mounts, not `:ns/:bundle` params.
 * - A mounted bundle may live at the upstream domain root or at any deeper upstream path.
 * - Matching is expected to use longest-prefix wins semantics.
 * - Mount paths should be treated as slash-normalized prefixes (start and end with `/`).
 * - Bundle upstream roots should be treated as slash-normalized base URLs (end with `/`).
 */
export declare namespace ReverseProxy {
  /** Public reverse proxy API. */
  export type Lib = {
    /** Create the HTTP application without starting a listener. */
    create(options?: StartOptions): App;

    /** Start the reverse proxy listener. */
    start(options?: StartOptions): Promise<void>;
  };

  /** Server application instance. */
  export type App = t.HonoApp;

  /**
   * Root fallback upstream.
   *
   * Used when the incoming request does not match any configured bundle mount.
   * This can point at a site root or any upstream path, for example:
   * - `https://example.com/`
   * - `https://example.com/foo/root/`
   */
  export type RootTarget = { upstream: t.StringUrl };

  /**
   * A locally mounted bundle.
   *
   * Example:
   * - `mountPath: '/foo/bar/'`
   * - `bundleRootUpstream: 'https://example.com/foo/bundle/'`
   *
   * Then these should map as:
   * - `/foo/bar/` -> `https://example.com/foo/bundle/`
   * - `/foo/bar/pkg/-entry.js` -> `https://example.com/foo/bundle/pkg/-entry.js`
   * - `/foo/bar/images/a.png` -> `https://example.com/foo/bundle/images/a.png`
   */
  export type BundleMount = {
    /**
     * Local mounted path-prefix.
     *
     * Must be stored in normalized form with a leading and trailing slash.
     * Examples:
     * - `/foo/`
     * - `/foo/bar/`
     * - `/foo/bar/baz/`
     */
    mountPath: t.StringUrlRoute;

    /**
     * Upstream bundle root base URL.
     *
     * May point at the upstream origin root or any deeper path.
     * Must be stored in normalized form with a trailing slash.
     */
    bundleRootUpstream: t.StringUrl;
  };

  /** Declarative reverse proxy routing configuration. */
  export type Config = {
    /** Fallback upstream used for requests that do not match a bundle mount. */
    root?: RootTarget;

    /** Bundle mounts, expected to be matched via longest-prefix wins. */
    mounts?: BundleMount[];
  };

  /** Options used when creating or starting the reverse proxy. */
  export type StartOptions = {
    /** Local listen port. */
    port?: number;

    /** Reverse proxy routing configuration. */
    config?: Config;
  };
}
