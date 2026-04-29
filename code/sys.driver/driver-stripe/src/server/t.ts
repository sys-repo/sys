import type * as THttp from '@sys/http/t';
import type * as TSys from '@sys/types';

export type { PortNumber, StringDir, StringHostname } from '@sys/types';

/**
 * Server-side helpers for the local Stripe PaymentElement fixture.
 *
 * This namespace is intentionally scoped to server/runtime use. It provides the
 * local proof endpoint used by package dev fixtures; it is not a browser API and
 * it is not a production Stripe runtime abstraction.
 */
export declare namespace StripeFixture {
  /** Local Stripe fixture API. */
  export type Lib = {
    /**
     * Runtime endpoint that mints a fresh Stripe PaymentIntent session.
     *
     * The browser calls this endpoint at runtime. The built browser bundle must
     * never contain the Stripe secret key or a baked PaymentIntent client secret.
     */
    readonly path: '/-/stripe/payment-intent';

    /**
     * Creates a runtime PaymentElement session response.
     *
     * Reads server-side Stripe configuration from the process environment and/or
     * local `.env` file under `args.cwd`, then calls Stripe to create a fresh
     * PaymentIntent. The response body is JSON:
     *
     * ```json
     * {
     *   "publishableKey": "pk_test_...",
     *   "clientSecret": "pi_..._secret_..."
     * }
     * ```
     *
     * Missing server-side Stripe configuration fails closed with a 503 response.
     */
    createSession(args?: SessionArgs): Promise<Response>;

    /**
     * Handles the fixture endpoint when a request matches {@link path}.
     *
     * Returns:
     * - `undefined` when the request is not for the Stripe fixture path.
     * - `405` when the path matches but the method is not `POST`.
     * - the session response from {@link createSession} for a valid `POST`.
     */
    handle(req: Request, args?: SessionArgs): Promise<Response | undefined>;

    /**
     * Starts the fixture and returns the owned HTTP lifecycle.
     *
     * Use this from tests and runtime orchestrators that need to close the
     * service explicitly. Startup is async because lifecycle configuration is
     * loaded from `args.cwd` before the HTTP server is bound.
     */
    start(args?: StartArgs): Promise<THttp.HttpServerStarted>;

    /**
     * Runs the fixture until its HTTP lifecycle finishes.
     *
     * This is the process/task adapter for `deno task fixture`: it delegates to
     * {@link start} and then awaits `server.finished`. Composed runtimes should
     * prefer `start(...)` so they can own shutdown.
     */
    serve(args?: ServeArgs): Promise<void>;
  };

  /** Arguments shared by fixture calls that read server-side Stripe configuration. */
  export type SessionArgs = {
    /**
     * Directory used when loading local environment configuration.
     *
     * Defaults to the current working directory. The fixture expects server-side
     * values such as `STRIPE_SECRET_KEY` and `STRIPE_PUBLISHABLE_KEY` to be
     * available from this context.
     */
    readonly cwd?: TSys.StringDir;
  };

  /** Startup options for acquiring the fixture lifecycle. */
  export type StartArgs = SessionArgs & {
    /** Human-readable service label used by the HTTP lifecycle startup output. */
    readonly name?: string;

    /**
     * TCP port for the fixture server.
     *
     * Defaults to `STRIPE_FIXTURE_PORT` from the environment, or `9090` when unset.
     */
    readonly port?: TSys.PortNumber;

    /**
     * Hostname/interface for the fixture server.
     *
     * Defaults to `127.0.0.1`.
     */
    readonly hostname?: TSys.StringHostname;

    /** Suppress HTTP server listen output. */
    readonly silent?: boolean;
  };

  /** Process-mode serving options; equivalent to {@link StartArgs}. */
  export type ServeArgs = StartArgs;

  /**
   * Server-side Stripe configuration used to create a PaymentIntent.
   *
   * This type is internal to the fixture implementation. `secretKey` must remain
   * server-side and must never be serialized into browser assets.
   */
  export type Config = {
    /** Stripe secret key used only by the server-side fixture. */
    readonly secretKey: string;

    /** Stripe publishable key returned to the browser as part of the runtime session. */
    readonly publishableKey: string;

    /** Payment amount in minor currency units, for example cents for USD. */
    readonly amount: number;

    /** Three-letter lowercase ISO currency code, for example `usd`. */
    readonly currency: string;
  };
}
