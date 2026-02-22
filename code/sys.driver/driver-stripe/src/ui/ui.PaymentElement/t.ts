import type { t } from './common.ts';

/**
 * Stripe Payment Element UI adapter.
 */
export declare namespace PaymentElement {
  export type Lib = { readonly UI: t.FC<Props> };
  export type Config = {
    elements?: t.StripeElementsOptionsClientSecret;
    paymentElement?: t.StripePaymentElementOptions;
  };

  export type Props = {
    publishableKey: string;
    clientSecret?: string;
    config?: Config;

    debug?: boolean;
    theme?: t.CommonTheme;
    style?: t.CssInput;

    onReady?: (element: t.StripePaymentElement) => void;
    onChange?: (event: t.StripePaymentElementChangeEvent) => void;
    onLoadError?: (error: Error) => void;
  };
}
