import type * as t from '@sys/types';

/**
 * Server-side helpers for the local Stripe PaymentElement fixture.
 *
 * This namespace is intentionally scoped to server/runtime use. It provides the
 * local proof endpoint used by the package fixture; it is not a browser API and
 * it is not a production Stripe runtime abstraction.
 */
export declare namespace StripeFixture {
  /**
   * Local Stripe fixture API.
   */
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
     * Serves a built `dist/` directory and the local Stripe runtime endpoint.
     *
     * This is the package-local fixture behind `deno task serve`. It is intended
     * for local proof/dev only: static browser assets are served from `dist`, and
     * `POST /-/stripe/payment-intent` mints the runtime session server-side.
     *
     * The promise resolves when the underlying server stops.
     */
    serve(args?: ServeArgs): Promise<void>;
  };

  /**
   * Arguments shared by fixture calls that read server-side Stripe configuration.
   */
  export type SessionArgs = {
    /**
     * Directory used when loading local environment configuration.
     *
     * Defaults to the current working directory. The fixture expects server-side
     * values such as `STRIPE_SECRET_KEY` and `STRIPE_PUBLISHABLE_KEY` to be
     * available from this context.
     */
    readonly cwd?: t.StringDir;
  };

  /**
   * Arguments for the local built-artifact fixture server.
   */
  export type ServeArgs = SessionArgs & {
    /**
     * Built artifact directory to serve.
     *
     * Defaults to `./dist` relative to {@link SessionArgs.cwd}.
     */
    readonly dist?: t.StringDir;

    /**
     * TCP port for the fixture server.
     *
     * Defaults to `PORT` from the environment, or `8080` when unset.
     */
    readonly port?: t.PortNumber;

    /**
     * Hostname/interface for the fixture server.
     *
     * Defaults to `127.0.0.1`.
     */
    readonly hostname?: t.StringHostname;
  };

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
