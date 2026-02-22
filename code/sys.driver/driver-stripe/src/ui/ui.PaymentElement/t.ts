import type { StripePaymentElement, StripePaymentElementChangeEvent } from '@stripe/stripe-js';
import type { t } from './common.ts';

/**
 * Stripe Payment Element UI adapter.
 */
export declare namespace PaymentElement {
  export type Lib = { readonly UI: t.FC<Props> };
  export type Props = {
    debug?: boolean;
    theme?: t.CommonTheme;
    style?: t.CssInput;

    onReady?: (element: StripePaymentElement) => void;
    onChange?: (event: StripePaymentElementChangeEvent) => void;
    onLoadError?: (error: Error) => void;
  };
}
