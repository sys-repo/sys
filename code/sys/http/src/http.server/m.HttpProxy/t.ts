import type { t } from './common.ts';

/**
 * Reverse proxy server.
 *
 * Design notes:
 * - Local mounts are modeled as path-prefix mounts, not `:ns/:bundle` params.
 * - A mounted upstream may live at the upstream domain root or at any deeper upstream path.
 * - Matching is expected to use longest-prefix wins semantics.
 * - Proxy routing does not rewrite HTML, `<base>`, service-worker, or asset URLs;
 *   route configs must cover every absolute prefix a proxied document references.
 * - Mount paths should be treated as slash-normalized prefixes (start and end with `/`).
 * - Upstream roots should be treated as slash-normalized base URLs (end with `/`).
 * - Upstream roots must not include query strings or hash fragments.
 */
export declare namespace HttpProxy {
  /** Public reverse proxy lifecycle API. */
  export type Lib = {
    /** Create the HTTP application without starting a listener. */
    create(options?: CreateOptions): App;

    /** Start a reverse proxy and return the standard HTTP server lifecycle handle. */
    start(args?: StartArgs): Promise<t.HttpServer.Started>;

    /** Durable reverse-proxy config owner affordances. */
    readonly Config: Config.Lib;

    /** Durable reverse-proxy root/default route owner affordances. */
    readonly Root: Root.Lib;

    /** Durable reverse-proxy mount owner affordances. */
    readonly Mount: Mount.Lib;
  };

  /** Options used when creating the reverse proxy application. */
  export type CreateOptions = {
    /** Advanced reverse proxy routing configuration. */
    readonly config?: Routing.Config;

    /** Lifecycle-friendly root/default upstream. Use `config` for advanced routing. */
    readonly root?: Root.Doc;

    /** Lifecycle-friendly path-prefix mounts. Use `config` for advanced routing. */
    readonly mounts?: readonly Mount.Doc[];
  };

  /** Arguments passed to [HttpProxy.start]. */
  export type StartArgs = CreateOptions & {
    /** Base directory used to resolve relative config refs. Defaults to the process cwd. */
    readonly cwd?: string;

    /** Config refs resolved by the caller and interpreted by this endpoint. */
    readonly paths?: { readonly config?: t.StringPath };

    /** Listen hostname. Defaults to the underlying HTTP server convention. */
    readonly hostname?: string;

    /** Local listen port. Defaults to the proxy endpoint convention. */
    readonly port?: number;

    /** Suppress startup output. */
    readonly silent?: boolean;

    /** Enable existing HTTP server keyboard handling. */
    readonly keyboard?: boolean | t.HttpServer.Start.Keyboard.Options;

    /** Display name forwarded to the HTTP server startup output. */
    readonly name?: string;

    /** Extra owner details exposed in structured status and startup output. */
    readonly info?: Record<string, string>;

    /** Canonical @sys lifecycle bridge. */
    readonly until?: t.UntilInput;
  };

  /** Backwards-compatible name for reverse proxy lifecycle options. */
  export type StartOptions = StartArgs;

  /** Server application instance. */
  export type App = t.HttpServer.App;

  /** Durable reverse-proxy config owner affordances. */
  export namespace Config {
    /** Owner config mutation API. */
    export type Lib = {
      /** Create or update a reverse-proxy config YAML document. */
      add(input: AddInput): Promise<AddResult>;
    };

    /** Durable YAML shape owned by the reverse-proxy endpoint. */
    export type Doc = {
      /** Display name forwarded to proxy startup output. */
      readonly name: string;

      /** Listen hostname. */
      readonly hostname: string;

      /** Listen port. Use `0` for an ephemeral port. */
      readonly port: number;

      /** Durable lifecycle-friendly root/default upstream declaration. */
      readonly root?: Root.Doc;

      /** Durable lifecycle-friendly mounted upstream declarations. */
      readonly mounts: readonly Mount.Doc[];
    };

    /** Config mutation input. */
    export type AddInput = {
      /** Base directory used to resolve relative `config` paths. */
      readonly cwd: t.StringDir;

      /** Proxy config ref: bare name or explicit YAML path. */
      readonly config?: string;

      /** Proxy display name. Defaults from `config`. */
      readonly name?: string;

      /** Listen hostname. */
      readonly hostname?: string;

      /** Listen port. */
      readonly port?: number | string;

      /** Preview the config mutation without writing. */
      readonly dryRun?: boolean;
    };

    /** Config mutation result. */
    export type AddResult = {
      /** Result kind. */
      readonly kind: 'added' | 'updated' | 'exists' | 'dry-run';

      /** Resolved config YAML path. */
      readonly yamlPath: t.StringPath;

      /** Whether the file did not exist before the mutation. */
      readonly created: boolean;

      /** Desired durable config document. */
      readonly config: Doc;
    };
  }

  /** Durable reverse-proxy root/default route owner affordances. */
  export namespace Root {
    /** Owner root/default route mutation API. */
    export type Lib = {
      /** Create or update the root/default upstream in a reverse-proxy config YAML document. */
      set(input: SetInput): Promise<SetResult>;
    };

    /** Durable lifecycle-friendly root/default upstream declaration. */
    export type Doc = {
      /** Absolute root/default upstream URL-prefix. Must end with `/` and include no query/hash. */
      readonly target: t.StringUrl;
    };

    /** Root/default route mutation input. */
    export type SetInput = {
      /** Base directory used to resolve relative `config` paths. */
      readonly cwd: t.StringDir;

      /** Proxy config ref: bare name or explicit YAML path. */
      readonly config?: string;

      /** Absolute root/default upstream URL-prefix. */
      readonly upstream?: string;

      /** Optional proxy display name used when the config must be created. */
      readonly name?: string;

      /** Optional listen hostname used when the config must be created. */
      readonly hostname?: string;

      /** Optional listen port used when the config must be created. */
      readonly port?: number | string;

      /** Preview the config mutation without writing. */
      readonly dryRun?: boolean;
    };

    /** Root/default route mutation result. */
    export type SetResult = {
      /** Result kind. */
      readonly kind: 'added' | 'updated' | 'exists' | 'dry-run';

      /** Resolved config YAML path. */
      readonly yamlPath: t.StringPath;

      /** Whether the file did not exist before the mutation. */
      readonly created: boolean;

      /** Desired durable config document. */
      readonly config: Config.Doc;

      /** Desired root/default upstream. */
      readonly root: Doc;
    };
  }

  /** Durable reverse-proxy mount owner affordances. */
  export namespace Mount {
    /** Owner mount mutation API. */
    export type Lib = {
      /** Create or update a mounted upstream in a reverse-proxy config YAML document. */
      add(input: AddInput): Promise<AddResult>;
    };

    /** Durable lifecycle-friendly mounted upstream declaration. */
    export type Doc = {
      /** Local path-prefix. Must start and end with `/`. */
      readonly path: t.StringUrlRoute;

      /** Absolute upstream URL-prefix. Must end with `/` and include no query/hash. */
      readonly target: t.StringUrl;
    };

    /** Mount mutation input. */
    export type AddInput = {
      /** Base directory used to resolve relative `config` paths. */
      readonly cwd: t.StringDir;

      /** Proxy config ref: bare name or explicit YAML path. */
      readonly config?: string;

      /** Local mounted path-prefix. */
      readonly mount?: string;

      /** Absolute upstream URL-prefix. */
      readonly upstream?: string;

      /** Optional proxy display name used when the config must be created. */
      readonly name?: string;

      /** Optional listen hostname used when the config must be created. */
      readonly hostname?: string;

      /** Optional listen port used when the config must be created. */
      readonly port?: number | string;

      /** Preview the config mutation without writing. */
      readonly dryRun?: boolean;
    };

    /** Mount mutation result. */
    export type AddResult = {
      /** Result kind. */
      readonly kind: 'added' | 'updated' | 'exists' | 'dry-run';

      /** Resolved config YAML path. */
      readonly yamlPath: t.StringPath;

      /** Whether the file did not exist before the mutation. */
      readonly created: boolean;

      /** Desired durable config document. */
      readonly config: Config.Doc;

      /** Desired mounted upstream. */
      readonly mount: Doc;
    };
  }

  /** Proxied-response adaptation contracts. */
  export namespace Response {
    /** Context available to response transforms. */
    export type TransformContext = {
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
    export type Transform = (
      response: globalThis.Response,
      context: TransformContext,
    ) => globalThis.Response | Promise<globalThis.Response>;

    /** Declarative proxied-response adaptation config. */
    export type Config = {
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
      readonly transform?: Transform;
    };
  }

  /** Advanced reverse-proxy routing model. */
  export namespace Routing {
    /** Declarative reverse proxy routing configuration. */
    export type Config = {
      /** Fallback upstream used for requests that do not match a configured mount. */
      readonly root?: Root;

      /** Mounted upstreams, expected to be matched via longest-prefix wins. */
      readonly mounts?: Mounts;
    };

    /**
     * Root fallback upstream.
     *
     * Used when the incoming request does not match any configured mount.
     * This can point at a site root or any upstream path, for example:
     * - `https://example.com/`
     * - `https://example.com/foo/root/`
     */
    export type Root = {
      /**
       * Upstream root base URL.
       *
       * May point at the upstream origin root or any deeper path.
       * Must be stored in normalized form with a trailing slash.
       * Must not include a query string or hash fragment.
       */
      readonly upstream: t.StringUrl;

      /** Route-scoped response header overrides. */
      readonly response?: Response.Config;
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
      readonly response?: Response.Config;
    };

    /** Collection of mounted upstream routes. */
    export type Mounts = readonly Mount[];

    /**
     * Pure request-path resolver.
     *
     * Input is expected to be the URL pathname only.
     * Query-string forwarding is handled by the runtime caller.
     */
    export type Resolver = (pathname: t.StringUrlRoute) => Resolve.Result;

    /**
     * Create a resolver from normalized routing configuration.
     *
     * Implementations are expected to validate and pre-sort mounts once up-front.
     */
    export type ResolverFactory = (config: Config) => Resolver;

    /** Pure resolver result model. */
    export namespace Resolve {
      /** Pure resolver output for one incoming request path. */
      export type Result = RootResult | MountResult | RedirectResult | NoneResult;

      /** Root fallback resolver result. */
      export type RootResult = {
        readonly kind: 'root';

        /**
         * Fully resolved upstream URL for the pathname only.
         * Query-string forwarding is handled by the runtime caller.
         */
        readonly upstream: t.StringUrl;

        /** Route-scoped response header overrides for the resolved root route. */
        readonly response?: Response.Config;
      };

      /** Mounted upstream resolver result. */
      export type MountResult = {
        readonly kind: 'mount';

        /**
         * Fully resolved upstream URL for the pathname only.
         * Query-string forwarding is handled by the runtime caller.
         */
        readonly upstream: t.StringUrl;

        /** Route-scoped response header overrides for the resolved mount. */
        readonly response?: Response.Config;
      };

      /** Trailing-slash redirect resolver result. */
      export type RedirectResult = {
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
      export type NoneResult = {
        /** No route matched and no root fallback exists. */
        readonly kind: 'none';
      };
    }
  }
}
