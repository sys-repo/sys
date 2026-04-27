import React from 'react';
import { PaymentElement } from '../ui/ui.PaymentElement/mod.ts';
import { loadRuntimeSession, readRuntimeConfig } from '../ui/ui.PaymentElement/-spec/-u.runtimeSession.ts';
import { Button, Color, css, ObjectView, Signal } from './common.ts';

type SessionState =
  | { readonly status: 'idle' }
  | { readonly status: 'loading' }
  | { readonly status: 'ready'; readonly publishableKey: string; readonly clientSecret: string }
  | { readonly status: 'error'; readonly error: Error };

const runtime = readRuntimeConfig();

/** Browser-safe standalone PaymentElement sample for production bundles. */
export function PaymentElementSample() {
  const theme = Signal.useSignal<'Light' | 'Dark'>('Dark');
  const debug = Signal.useSignal(false);
  const loadSession = Signal.useSignal(true);
  const session = useRuntimeSession(loadSession.value, runtime.sessionUrl);
  const ready = session.status === 'ready';
  const colors = Color.theme(theme.value);

  const styles = {
    root: css({
      Absolute: 0,
      display: 'grid',
      gridTemplateColumns: '1fr 360px',
      backgroundColor: colors.bg,
      color: colors.fg,
      overflow: 'hidden',
    }),
    stage: css({
      display: 'grid',
      placeItems: 'center',
      backgroundImage: `linear-gradient(${Color.alpha(colors.fg, 0.08)} 1px, transparent 1px), linear-gradient(90deg, ${Color.alpha(colors.fg, 0.08)} 1px, transparent 1px)`,
      backgroundSize: '360px 360px',
    }),
    card: css({
      width: 360,
      minHeight: 120,
      padding: 20,
      borderRadius: 8,
      border: `1px solid ${Color.alpha(colors.fg, 0.12)}`,
      backgroundColor: Color.alpha(colors.bg, 0.24),
      boxShadow: `0 18px 45px ${Color.alpha('#000', 0.18)}`,
    }),
    side: css({
      padding: 22,
      backgroundColor: Color.theme('Light').bg,
      color: Color.theme('Light').fg,
      borderLeft: `1px solid ${Color.alpha(Color.theme('Light').fg, 0.12)}`,
      overflow: 'auto',
    }),
    title: css({ fontWeight: 'bold', marginBottom: 8 }),
    pie: css({ pointerEvents: 'none', position: 'absolute', left: 18, bottom: 12, fontSize: 64 }),
  };

  const summary = {
    runtime,
    session: session.status,
    error: session.status === 'error' ? session.error.message : undefined,
  };

  return (
    <div className={styles.root.class}>
      <div className={styles.stage.class}>
        <div className={styles.card.class}>
          <PaymentElement.UI
            debug={debug.value}
            theme={theme.value}
            publishableKey={ready ? session.publishableKey : ''}
            clientSecret={ready ? session.clientSecret : undefined}
            onReady={(element) => console.info(`⚡️ onReady:`, element)}
            onChange={(event) => console.info(`⚡️ onChange:`, event)}
            onLoadError={(error) => console.info(`⚡️ onLoadError`, error)}
          />
        </div>
        <div className={styles.pie.class}>{'🥧'}</div>
      </div>
      <div className={styles.side.class}>
        <div className={styles.title.class}>{'Stripe.PaymentElement'}</div>
        <Button
          block
          label={() => `theme: ${theme.value}`}
          onClick={() => (theme.value = theme.value === 'Dark' ? 'Light' : 'Dark')}
        />
        <hr />
        <Button block label={() => `debug: ${debug.value}`} onClick={() => Signal.toggle(debug)} />
        <Button
          block
          label={() => `runtime session: ${loadSession.value ? 'enabled' : 'disabled'}`}
          onClick={() => Signal.toggle(loadSession)}
        />
        <ObjectView name={'debug'} data={summary} expand={0} style={{ marginTop: 20 }} />
      </div>
    </div>
  );
}

/**
 * Helpers:
 */
function useRuntimeSession(enabled: boolean, sessionUrl: string): SessionState {
  const [state, setState] = React.useState<SessionState>({ status: 'idle' });

  React.useEffect(() => {
    if (!enabled) {
      setState({ status: 'idle' });
      return;
    }

    const abort = new AbortController();
    setState({ status: 'loading' });

    loadRuntimeSession({ sessionUrl, signal: abort.signal })
      .then((session) => setState({ status: 'ready', ...session }))
      .catch((cause) => {
        if (abort.signal.aborted) return;
        const error = cause instanceof Error ? cause : new Error('Stripe runtime session failed.');
        setState({ status: 'error', error });
        console.info(`⚡️ runtime session failed:`, error);
      });

    return () => abort.abort();
  }, [enabled, sessionUrl]);

  return state;
}
