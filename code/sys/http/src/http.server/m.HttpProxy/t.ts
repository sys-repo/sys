import type { t } from './common.ts';

/**
 * Reverse proxy server.
 *
 * Design notes:
 * - Local mounts are modeled as path-prefix mounts, not `:ns/:bundle` params.
 * - A mounted upstream may live at the upstream domain root or at any deeper upstream path.
 * - Matching is expected to use longest-prefix wins semantics.
 * - Mount paths should be treated as slash-normalized prefixes (start and end with `/`).
 * - Upstream roots should be treated as slash-normalized base URLs (end with `/`).
 * - Upstream roots must not include query strings or hash fragments.
 */
export declare namespace HttpProxy {
  /** Context available to response transforms. */
  export type ResponseTransformContext = {
    /** Original incoming request received by the proxy. */
    readonly request: Request;

    /** Original local proxy pathname, before any upstream joining. */
    readonly pathname: t.StringUrlRoute;

    /** Fully resolved upstream request URL including the query-string. */
    readonly upstream: t.StringUrl;

    /** Resolved proxy route kind. */
    readonly routeKind: 'root' | 'mount';
  };

  /** Route-scoped response transform applied to proxied responses. */
  export type ResponseTransform = (
    response: Response,
    context: ResponseTransformContext,
  ) => Response | Promise<Response>;

  /** Declarative proxied-response adaptation config. */
  export type ResponseConfig = {
    /** Headers to set on the outgoing proxied response. */
    readonly headers?: HeadersInit;

    /**
     * Optional response transform hook.
     *
     * Intended for targeted proxy adaptations such as HTML base-tag rewrites,
     * cookie/header normalization, or content-type-sensitive response shaping.
     * Header overrides are applied after the transform so declarative headers
     * remain authoritative.
     *
     * Contract:
     * - Treat this as a targeted response adaptation hook, not a blanket
     *   interception layer.
     * - Transforms that rewrite payload bytes are responsible for returning a
     *   body/header-coherent `Response`.
     * - In practice, body rewrites should usually be content-type-gated and
     *   return a fresh `Response` so representation headers such as
     *   `content-length` remain correct.
     */
    readonly transform?: ResponseTransform;
  };

  /** Public reverse proxy lifecycle API. */
  export type Lib = {
    /** Create the HTTP application without starting a listener. */
    create(options?: CreateOptions): App;

    /** Start a reverse proxy and return the standard HTTP server lifecycle handle. */
    start(args?: StartArgs): Promise<t.HttpServerStarted>;
  };

  /** Options used when creating the reverse proxy application. */
  export type CreateOptions = {
    /** Advanced reverse proxy routing configuration. */
    readonly config?: Config;

    /** Lifecycle-friendly path-prefix mounts. Use `config` for root fallback or advanced routing. */
    readonly mounts?: readonly StartMount[];
  };

  /** Arguments passed to [HttpProxy.start]. */
  export type StartArgs = CreateOptions & {
    /** Listen hostname. Defaults to the underlying HTTP server convention. */
    readonly hostname?: string;

    /** Local listen port. Defaults to the proxy endpoint convention. */
    readonly port?: number;

    /** Suppress startup output. */
    readonly silent?: boolean;

    /** Enable existing HTTP server keyboard handling. */
    readonly keyboard?: boolean | t.HttpServerStartKeyboardOptions;

    /** Display name forwarded to the HTTP server startup output. */
    readonly name?: string;

    /** Extra startup output fields forwarded to the HTTP server. */
    readonly info?: Record<string, string>;

    /** Canonical @sys lifecycle bridge. */
    readonly until?: t.UntilInput;
  };

  /** Backwards-compatible name for reverse proxy lifecycle options. */
  export type StartOptions = StartArgs;

  /** Lifecycle-friendly mounted upstream declaration. */
  export type StartMount = {
    /** Local path-prefix. Must start and end with `/`. */
    readonly path: t.StringUrlRoute;

    /** Absolute upstream URL-prefix. Must end with `/` and include no query/hash. */
    readonly target: t.StringUrl;

    /** Route-scoped response header overrides/transforms. */
    readonly response?: ResponseConfig;
  };

  /** Server application instance. */
  export type App = t.HonoApp;

  /**
   * Root fallback upstream.
   *
   * Used when the incoming request does not match any configured mount.
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

    /** Route-scoped response header overrides. */
    readonly response?: ResponseConfig;
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

    /** Route-scoped response header overrides. */
    readonly response?: ResponseConfig;
  };

  /** Collection of mounted upstream routes. */
  export type Mounts = readonly Mount[];

  /** Declarative reverse proxy routing configuration. */
  export type Config = {
    /** Fallback upstream used for requests that do not match a configured mount. */
    readonly root?: RootTarget;

    /** Mounted upstreams, expected to be matched via longest-prefix wins. */
    readonly mounts?: Mounts;
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

    /** Route-scoped response header overrides for the resolved root route. */
    readonly response?: ResponseConfig;
  };

  /** Mounted upstream resolver result. */
  export type ResolveMountResult = {
    readonly kind: 'mount';

    /**
     * Fully resolved upstream URL for the pathname only.
     * Query-string forwarding is handled by the runtime caller.
     */
    readonly upstream: t.StringUrl;

    /** Route-scoped response header overrides for the resolved mount. */
    readonly response?: ResponseConfig;
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
