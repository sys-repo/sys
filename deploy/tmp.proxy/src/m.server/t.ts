import type { t } from './common.ts';

/**
 * Reverse proxy server.
 *
 * Design notes:
 * - Local bundle mounts are modeled as path-prefix mounts, not `:ns/:bundle` params.
 * - A mounted bundle may live at the upstream domain root or at any deeper upstream path.
 * - Matching is expected to use longest-prefix wins semantics.
 * - Mount paths should be treated as slash-normalized prefixes (start and end with `/`).
 * - Upstream roots should be treated as slash-normalized base URLs (end with `/`).
 * - Upstream roots must not include query strings or hash fragments.
 */
export declare namespace ReverseProxy {
  /** Public reverse proxy API. */
  export type Lib = {
    /** Create the HTTP application without starting a listener. */
    create(options?: StartOptions): App;

    /** Start the reverse proxy listener. */
    start(options?: StartOptions): Promise<void>;
  };

  /** Options used when creating or starting the reverse proxy. */
  export type StartOptions = {
    /** Local listen port. */
    readonly port?: number;
    /** Reverse proxy routing configuration. */
    readonly config?: Config;
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
  export type RootTarget = {
    /**
     * Upstream root base URL.
     *
     * May point at the upstream origin root or any deeper path.
     * Must be stored in normalized form with a trailing slash.
     * Must not include a query string or hash fragment.
     */
    readonly upstream: t.StringUrl;
  };

  /**
   * A locally mounted upstream.
   *
   * Example:
   * - `mountPath: '/foo/bar/'`
   * - `upstream: 'https://example.com/foo/bundle/'`
   *
   * Then these should map as:
   * - `/foo/bar/` -> `https://example.com/foo/bundle/`
   * - `/foo/bar/pkg/-entry.js` -> `https://example.com/foo/bundle/pkg/-entry.js`
   * - `/foo/bar/images/a.png` -> `https://example.com/foo/bundle/images/a.png`
   */
  export type Mount = {
    /**
     * Local mounted path-prefix.
     *
     * Must be stored in normalized form with a leading and trailing slash.
     * Invalid:
     * - `/`
     *
     * Examples:
     * - `/foo/`
     * - `/foo/bar/`
     * - `/foo/bar/baz/`
     */
    readonly mountPath: t.StringUrlRoute;

    /**
     * Upstream root base URL.
     *
     * May point at the upstream origin root or any deeper path.
     * Must be stored in normalized form with a trailing slash.
     * Must not include a query string or hash fragment.
     */
    readonly upstream: t.StringUrl;
  };

  /** Declarative reverse proxy routing configuration. */
  export type Config = {
    /** Fallback upstream used for requests that do not match a bundle mount. */
    readonly root?: RootTarget;

    /** Mounted upstreams, expected to be matched via longest-prefix wins. */
    readonly mounts?: readonly Mount[];
  };

  /**
   * Pure request-path resolver.
   *
   * Input is expected to be the URL pathname only.
   * Query-string forwarding is handled by the runtime caller.
   */
  export type Resolver = (pathname: t.StringUrlRoute) => ResolveResult;

  /**
   * Create a resolver from normalized routing configuration.
   *
   * Implementations are expected to validate and pre-sort mounts once up-front.
   */
  export type ResolverFactory = (config: Config) => Resolver;

  /** Pure resolver output for one incoming request path. */
  export type ResolveResult =
    | ResolveRootResult
    | ResolveMountResult
    | ResolveRedirectResult
    | ResolveNoneResult;

  /** Root fallback resolver result. */
  export type ResolveRootResult = {
    readonly kind: 'root';

    /**
     * Fully resolved upstream URL for the pathname only.
     * Query-string forwarding is handled by the runtime caller.
     */
    readonly upstream: t.StringUrl;
  };

  /** Mounted bundle resolver result. */
  export type ResolveMountResult = {
    readonly kind: 'mount';

    /**
     * Fully resolved upstream URL for the pathname only.
     * Query-string forwarding is handled by the runtime caller.
     */
    readonly upstream: t.StringUrl;
  };

  /** Trailing-slash redirect resolver result. */
  export type ResolveRedirectResult = {
    /**
     * `308` redirect target.
     *
     * This is an absolute local path only, not a full origin URL.
     * Query-string forwarding is handled by the runtime caller.
     * Runtime should intentionally preserve the original HTTP method semantics.
     */
    readonly kind: 'redirect';
    readonly location: t.StringUrlRoute;
  };

  /** No-match resolver result. */
  export type ResolveNoneResult = {
    /** No route matched and no root fallback exists. */
    readonly kind: 'none';
  };
}
