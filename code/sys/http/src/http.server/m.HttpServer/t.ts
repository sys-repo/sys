import type {
  Context as THonoContext,
  Hono as THonoAppBase,
  MiddlewareHandler as THonoMiddlewareHandler,
  Schema as THonoSchema,
} from 'hono';
import type { cors } from 'hono/cors';
import type { BlankSchema as THonoBlankSchema, Env as THonoEnv } from 'hono/types';
import type { t } from './common.ts';

/**
 * HTTP server contracts.
 */
export declare namespace HttpServer {
  /** HTTP server helper library. */
  export type Lib = {
    readonly Hono: typeof THonoAppBase;
    readonly cors: typeof cors;
    readonly static: ServeStatic.Method;
    forceDirSlash(root: string, strip?: string): Hono.MiddlewareHandler;
    create(options?: Create.Options): App;
    start(app: App, options?: Start.Options): Started;
    options(args?: Options.Args): Deno.ServeOptions<Deno.NetAddr>;
    print(args: Print.Options): void;
    keyboard(args: Keyboard.Args): Promise<void>;
  };

  /** Server application instance. */
  export type App = Hono.App;

  /** Running server returned by `HttpServer.start`. */
  export type Started = t.LifecycleAsync & {
    readonly app: App;
    readonly server: Deno.HttpServer<Deno.NetAddr>;
    readonly addr: Deno.NetAddr;
    readonly hostname: t.StringHostname;
    readonly port: t.PortNumber;

    /** Local browser-safe HTTP origin, e.g. `http://localhost:8080`. */
    readonly origin: t.StringUrl;

    /** Server lifecycle signal; aborted when this context is disposed or closed. */
    readonly signal: AbortSignal;

    /** Resolves when the underlying Deno server has finished. */
    readonly finished: Promise<void>;

    /** Renderer-neutral service status snapshot. */
    status(): t.Service.Status;

    /** HTTP/domain alias for `dispose()`. */
    close(reason?: unknown): Promise<void>;
  };

  /**
   * HTTP server creation contracts.
   */
  export namespace Create {
    /** Options passed to the creation of a server. */
    export type Options = {
      pkg?: t.Pkg;
      hash?: t.StringHash;
      cors?: boolean;
      static?: boolean | t.StringDir | [t.StringUrlRoute, t.StringDir];
    };
  }

  /**
   * Deno serve-options contracts.
   */
  export namespace Options {
    /** Arguments passed to `HttpServer.options`. */
    export type Args = {
      port?: number;
      pkg?: t.Pkg;
      hash?: t.StringHash;
      name?: string;
      info?: Record<string, string>;
      silent?: boolean;
      dir?: string;
      status?: Status.Options;
    };
  }

  /**
   * Keyboard helper contracts.
   */
  export namespace Keyboard {
    /** Arguments passed to `HttpServer.keyboard`. */
    export type Args = {
      port: number;
      url?: string;
      print?: boolean;
      exit?: boolean;
      dispose?: () => Promise<void>;
    };
  }

  /**
   * HTTP server start contracts.
   */
  export namespace Start {
    /** Arguments passed to `HttpServer.start`. */
    export type Options = {
      port?: t.PortNumber;
      hostname?: t.StringHostname;
      pkg?: t.Pkg;
      hash?: t.StringHash;
      name?: string;
      info?: Record<string, string>;
      silent?: boolean;
      dir?: t.StringDir;

      /** Structured, renderer-neutral status metadata for the running server handle. */
      status?: Status.Options;

      /** Canonical @sys lifecycle bridge. */
      until?: t.UntilInput;

      keyboard?: boolean | Keyboard.Options;
    };

    /**
     * HTTP server start keyboard contracts.
     */
    export namespace Keyboard {
      /** Keyboard behavior for `HttpServer.start`. */
      export type Options = {
        print?: boolean;

        /**
         * Exit the process when keyboard quit is received.
         *
         * Defaults to false. Server shutdown is the primitive behavior;
         * process exit must be explicit.
         */
        exit?: boolean;
      };
    }
  }

  /**
   * HTTP server status contracts.
   */
  export namespace Status {
    /** Structured status metadata passed to `HttpServer.start`. */
    export type Options = {
      /** Owner-local kind, e.g. `http`, `static`, or `proxy`. */
      readonly kind?: string;

      /** Owner config path, if the server was started from one. */
      readonly config?: t.StringPath;

      /** Primary served filesystem root, if the server has one. Defaults to `dir`. */
      readonly root?: t.StringDir;

      /** URL paths to resolve against the server origin. Defaults to `/`. */
      readonly urlPaths?: readonly UrlPath[];

      /** Extra owner facts that are not URLs and not lifecycle control. */
      readonly details?: readonly t.Service.Detail[];
    };

    /** Server status URL path descriptor. */
    export type UrlPath =
      | t.StringUrlRoute
      | { readonly path: t.StringUrlRoute; readonly label?: string };
  }

  /**
   * HTTP server print contracts.
   */
  export namespace Print {
    /** Arguments passed to `HttpServer.print`. */
    export type Options = {
      addr: Deno.NetAddr;
      pkg?: t.Pkg;
      hash?: t.StringHash;
      name?: string;
      info?: Record<string, string>;
      requestedPort?: t.PortNumber;
      dir?: t.StringDir;
      status?: Status.Options;
      keyboard?: Keyboard.Options;
    };

    /**
     * HTTP server print keyboard contracts.
     */
    export namespace Keyboard {
      /** Keyboard affordances rendered in HTTP startup output. */
      export type Options = {
        /** Key used to open the primary URL in a browser. */
        readonly open?: string;

        /** Keys used to stop the server. */
        readonly quit?: string;
      };
    }
  }

  /**
   * Static file-server middleware contracts.
   */
  export namespace ServeStatic {
    /** Create static file-server middleware. */
    export type Method = (input: Options | t.StringDir) => Hono.MiddlewareHandler;

    /** Options passed to the static server middleware. */
    export type Options<E extends THonoEnv = THonoEnv> = {
      root?: string;
      path?: string;
      precompressed?: boolean;
      mimes?: Record<string, string>;
      rewriteRequestPath?: (path: string) => string;
      onFound?: (path: string, c: THonoContext<E>) => void | Promise<void>;
      onNotFound?: (path: string, c: THonoContext<E>) => void | Promise<void>;
    };
  }

  /**
   * Hono interop contracts.
   */
  export namespace Hono {
    /** Hono Server application instance. */
    export type App = THonoAppBase<THonoEnv, THonoBlankSchema, '/'>;
    /** Empty Hono route schema. */
    export type BlankSchema = THonoBlankSchema;
    /** Hono request/response context. */
    export type Context = THonoContext;
    /** Hono environment binding contract. */
    export type Env = THonoEnv;
    /** Hono middleware function contract. */
    export type MiddlewareHandler = THonoMiddlewareHandler;
    /** Hono route schema contract. */
    export type Schema = THonoSchema;
  }

  /**
   * HTTP route contracts.
   */
  export namespace Route {
    /** Context passed into route handlers. */
    export type Context = {
      readonly app: App;
    };
  }
}
