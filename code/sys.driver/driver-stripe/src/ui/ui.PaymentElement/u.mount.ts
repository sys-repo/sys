import { loadStripe } from '@stripe/stripe-js';
import type { t } from './common.ts';
import { StripeAppearance } from './u.appearance.ts';

export type PaymentElementMountHandle = { dispose: () => void };
export type PaymentElementMountArgs = {
  mount: HTMLElement;
  publishableKey: string;
  clientSecret: string;
  theme?: t.CommonTheme;
  config?: t.PaymentElement.Config;
  onReady?: (element: t.StripePaymentElement) => void;
  onChange?: (event: t.StripePaymentElementChangeEvent) => void;
};

/**
 * Imperative Stripe Payment Element mount helper.
 */
export async function mountPaymentElement(
  args: PaymentElementMountArgs,
): Promise<PaymentElementMountHandle> {
  const { mount, publishableKey, clientSecret, theme, config, onReady, onChange } = args;

  const stripe = await loadStripe(publishableKey);
  if (!stripe) throw new Error('Failed to load Stripe.js');

  const elementsOptions = config?.elements;
  const appearance = {
    ...StripeAppearance.fromTheme(theme),
    ...(elementsOptions?.appearance ?? {}),
  } satisfies t.Appearance;

  // Interop boundary: v1 mounts via the `clientSecret` initialization path.
  const elements = stripe.elements({
    ...(elementsOptions ?? {}),
    appearance,
    clientSecret,
  });

  const payment = elements.create('payment', config?.paymentElement);

  const ready = () => onReady?.(payment);
  const change = (event: t.StripePaymentElementChangeEvent) => onChange?.(event);

  payment.on('ready', ready);
  payment.on('change', change);
  payment.mount(mount);

  let disposed = false;
  const dispose = () => {
    if (disposed) return;
    disposed = true;

    // Best effort cleanup (Stripe event/listener + DOM mount).
    payment.off('ready', ready);
    payment.off('change', change);
    payment.unmount();
    payment.destroy();
  };

  return { dispose };
}
