import type {
  Context as THonoContext,
  Hono as THonoAppBase,
  MiddlewareHandler as THonoMiddlewareHandler,
  Schema as THonoSchema,
} from 'hono';
import type { cors } from 'hono/cors';
import type { BlankSchema as THonoBlankSchema, Env as THonoEnv } from 'hono/types';
import * as TFileBytes from '../m.FileBytes/t.ts';
import type { t } from './common.ts';

/**
 * HTTP servers built on Hono.
 */
export declare namespace HttpServer {
  /** Create, start, and display HTTP servers. */
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

  /**
   * Running server returned by `HttpServer.start`.
   * Disposal waits for server shutdown, Deno's completion promise, and keyboard cleanup.
   * All disposal calls share one promise. Status stays `stopping` until all three finish;
   * if any remain pending, disposal also remains pending.
   */
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

    /** Native Deno server completion; does not include managed keyboard cleanup or shutdown errors. */
    readonly finished: Promise<void>;

    /** Current service status, without terminal formatting. */
    status(): t.Service.Status;

    /** Detail formatting captured at startup, separate from status and serialized data. */
    readonly servicePresentation?: t.Cli.Fmt.Service.Presentation;

    /**
     * Alias for `dispose()` and `[Symbol.asyncDispose]()`; attempts server shutdown once.
     * One failure is rethrown unchanged. Multiple distinct failures form an `AggregateError`
     * in shutdown → Deno completion → keyboard order, with the first failure as `cause`.
     * Duplicates are removed using `Object.is`; nested errors are not flattened.
     */
    close(reason?: unknown): Promise<void>;
  };

  /**
   * Creating a server application.
   */
  export namespace Create {
    /** Options for creating a server application. */
    export type Options = {
      pkg?: t.Pkg;
      hash?: t.StringHash;
      cors?: boolean;
      static?: boolean | t.StringDir | [t.StringUrlRoute, t.StringDir];
    };
  }

  /**
   * Deno server options.
   */
  export namespace Options {
    /** Arguments passed to `HttpServer.options`. */
    export type Args = {
      port?: number;
      /**
       * With an explicit `port`, bypass available-port selection and bind that value directly.
       * Without `port`, preserve ordinary port selection.
       */
      strictPort?: boolean;
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
   * Keyboard controls for a running server.
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
   * Starting an HTTP server.
   */
  export namespace Start {
    /** Report the bound numeric loopback address instead of localhost. */
    export type OriginMode = 'exact-loopback';

    /** Arguments passed to `HttpServer.start`. */
    export type Options = {
      port?: t.PortNumber;
      /**
       * With an explicit `port`, bypass available-port selection and bind that value directly.
       * Without `port`, preserve ordinary port selection.
       */
      strictPort?: boolean;
      hostname?: t.StringHostname;
      pkg?: t.Pkg;
      hash?: t.StringHash;
      name?: string;
      info?: Record<string, string>;
      silent?: boolean;
      dir?: t.StringDir;

      /** Service details included in the running server's status. */
      status?: Status.Options;

      /** Format detail values for terminal output; never stored in status. */
      formatDetail?: Print.FormatDetail;

      /**
       * Report the bound numeric loopback address instead of `localhost`.
       * Only `127.0.0.1` and `::1` binds are accepted.
       * Omit to display local bind addresses as `localhost`.
       */
      origin?: OriginMode;

      /** Link server disposal to an external lifecycle. */
      until?: t.UntilInput;

      keyboard?: boolean | Keyboard.Options;
    };

    /**
     * Keyboard controls enabled during startup.
     */
    export namespace Keyboard {
      /** Keyboard behavior for `HttpServer.start`. */
      export type Options = {
        print?: boolean;

        /**
         * Exit the process after keyboard-triggered server shutdown completes.
         *
         * Defaults to false: stopping the server does not exit the process.
         */
        exit?: boolean;
      };
    }
  }

  /**
   * Service status reported by the server.
   */
  export namespace Status {
    /** Service details supplied at startup. */
    export type Options = {
      /** Service kind, e.g. `http`, `static`, or `proxy`. */
      readonly kind?: string;

      /** Configuration path supplied at startup. */
      readonly config?: t.StringPath;

      /** Primary served filesystem root, if the server has one. Defaults to `dir`. */
      readonly root?: t.StringDir;

      /** URL paths to resolve against the server origin. Defaults to `/`. */
      readonly urlPaths?: readonly UrlPath[];

      /** Additional label/value details, separate from URLs. */
      readonly details?: readonly t.Service.Detail[];
    };

    /** A URL path, optionally labelled. */
    export type UrlPath =
      | t.StringUrlRoute
      | { readonly path: t.StringUrlRoute; readonly label?: string };
  }

  /**
   * Startup output for an HTTP server.
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
      formatDetail?: FormatDetail;
      keyboard?: Keyboard.Options;
    };

    /** Format a service detail value for terminal output. */
    export type FormatDetail = t.Cli.Fmt.Service.FormatDetail;

    /**
     * Keyboard hints shown in startup output.
     */
    export namespace Keyboard {
      /** Open and quit hints to display; printing does not bind keys. */
      export type Options = t.Cli.Fmt.Service.Keyboard;
    }
  }

  /**
   * Constrained file-byte responses.
   */
  export import ServeFileBytes = TFileBytes.FileBytes;

  /**
   * Static file-server middleware.
   */
  export namespace ServeStatic {
    /** Create static file-server middleware. */
    export type Method = (input: Options | t.StringDir) => Hono.MiddlewareHandler;

    /** Options passed to the static server middleware. */
    export type Options<E extends THonoEnv = THonoEnv> = {
      root?: string;
      path?: string;
      precompressed?: boolean;
      rewriteRequestPath?: (path: string) => string;
      onFound?: (path: string, c: THonoContext<E>) => void | Promise<void>;
      onNotFound?: (path: string, c: THonoContext<E>) => void | Promise<void>;
    };
  }

  /**
   * Hono applications, requests, and middleware.
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
   * HTTP route handlers.
   */
  export namespace Route {
    /** Context passed into route handlers. */
    export type Context = {
      readonly app: App;
    };
  }
}
