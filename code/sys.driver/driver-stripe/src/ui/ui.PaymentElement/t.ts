import type { t } from './common.ts';

/**
 * Stripe Payment Element UI adapter.
 */
export declare namespace PaymentElement {
  /** Runtime surface for rendering a Stripe Payment Element in React. */
  export type Lib = { readonly UI: t.FC<Props> };

  /** Stripe Elements configuration forwarded to the mounted Payment Element. */
  export type Config = {
    /** Stripe Elements options, typically including the client secret. */
    elements?: t.StripeElementsOptionsClientSecret;

    /** Stripe Payment Element options controlling layout and payment-method display. */
    paymentElement?: t.StripePaymentElementOptions;
  };

  /** Props for the Stripe Payment Element React adapter. */
  export type Props = {
    /** Stripe publishable key used to initialize Stripe.js in the browser. */
    publishableKey: string;

    /** Runtime client secret for the current PaymentIntent or SetupIntent. */
    clientSecret?: string;

    /** Optional Stripe Elements and Payment Element configuration. */
    config?: Config;

    /** Render diagnostic state in the local dev harness. */
    debug?: boolean;

    /** Theme token set used by the surrounding @sys UI shell. */
    theme?: t.CommonTheme;

    /** Optional wrapper CSS input for the mounted adapter surface. */
    style?: t.CssInput;

    /** Called once the Stripe Payment Element instance is ready. */
    onReady?: (element: t.StripePaymentElement) => void;

    /** Called when the mounted Payment Element emits a change event. */
    onChange?: (event: t.StripePaymentElementChangeEvent) => void;

    /** Called when Stripe fails to load or mount the Payment Element. */
    onLoadError?: (error: Error) => void;
  };
}
