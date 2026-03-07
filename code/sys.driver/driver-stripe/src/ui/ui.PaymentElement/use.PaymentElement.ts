import React from 'react';
import { type t, Obj } from './common.ts';
import { mountPaymentElement } from './u.mount.ts';

export type PaymentElementHookArgs = {
  mountRef: React.RefObject<HTMLDivElement | null>;
  props: t.PaymentElement.Props;
};

export type PaymentElementHookState = {
  readonly ready: boolean;
  readonly error?: Error;
  readonly configured: boolean;
};

/**
 * React lifecycle plumbing for the Stripe Payment Element mount helper.
 */
export function usePaymentElement(args: PaymentElementHookArgs): PaymentElementHookState {
  const { mountRef, props } = args;
  const [ready, setReady] = React.useState(false);
  const [error, setError] = React.useState<Error | undefined>(undefined);
  const onReadyRef = React.useRef(props.onReady);
  const onChangeRef = React.useRef(props.onChange);
  const onLoadErrorRef = React.useRef(props.onLoadError);

  const configured = Boolean(props.publishableKey && props.clientSecret);
  const mountKey = React.useMemo(
    () => wrangle.mountKey(props),
    [props.clientSecret, props.theme, props.config],
  );

  React.useEffect(() => void (onReadyRef.current = props.onReady), [props.onReady]);
  React.useEffect(() => void (onChangeRef.current = props.onChange), [props.onChange]);
  React.useEffect(() => void (onLoadErrorRef.current = props.onLoadError), [props.onLoadError]);

  React.useEffect(() => {
    setReady(false);
    setError(undefined);

    const mount = mountRef.current;
    const publishableKey = props.publishableKey;
    const clientSecret = props.clientSecret;
    if (!mount || !publishableKey || !clientSecret) return;

    let cancelled = false;
    let dispose: (() => void) | undefined;

    const run = async () => {
      try {
        const handle = await mountPaymentElement({
          mount,
          publishableKey,
          clientSecret,
          theme: props.theme,
          config: props.config,
          onReady(element) {
            if (cancelled) return;
            setReady(true);
            onReadyRef.current?.(element);
          },
          onChange(event) {
            if (cancelled) return;
            onChangeRef.current?.(event);
          },
        });

        if (cancelled) handle.dispose();
        else dispose = handle.dispose;
      } catch (cause) {
        if (cancelled) return;
        const error = wrangle.error(cause);
        setError(error);
        onLoadErrorRef.current?.(error);
      }
    };

    run();
    return () => {
      cancelled = true;
      dispose?.();
    };
  }, [mountRef, props.publishableKey, props.clientSecret, mountKey]);

  return { ready, error, configured } as const;
}

/**
 * Helpers:
 */
const wrangle = {
  mountKey(props: t.PaymentElement.Props) {
    const { clientSecret, theme, config } = props;
    return Obj.hash({ clientSecret, theme, config });
  },

  error(cause: unknown): Error {
    if (cause instanceof Error) return cause;
    return new Error(typeof cause === 'string' ? cause : 'Stripe Payment Element failed to load');
  },
} as const;
