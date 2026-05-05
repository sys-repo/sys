import React from 'react';
import { PaymentElement } from '../ui/ui.PaymentElement/mod.ts';
import { loadRuntimeSession, readRuntimeConfig } from '../ui/ui.PaymentElement/-spec/-u.runtimeSession.ts';
import { Button, Color, Cropmarks, css, ObjectView, Signal } from './common.ts';

type SessionState =
  | { readonly status: 'idle' }
  | { readonly status: 'loading' }
  | { readonly status: 'ready'; readonly publishableKey: string; readonly clientSecret: string }
  | { readonly status: 'error'; readonly error: Error };

const runtime = readRuntimeConfig();
const defaults = {
  debug: false,
  theme: 'Dark' as const,
  loadSession: true,
};

/** Browser-safe standalone PaymentElement sample for production bundles. */
export function PaymentElementSample() {
  const theme = Signal.useSignal<'Light' | 'Dark'>(defaults.theme);
  const debug = Signal.useSignal(defaults.debug);
  const loadSession = Signal.useSignal(defaults.loadSession);
  const signals = { debug, theme, loadSession };
  const v = Signal.toObject(signals);
  Signal.useRedrawEffect(() => Signal.listen(signals, true));

  const session = useRuntimeSession(v.loadSession, runtime.sessionUrl);
  const ready = session.status === 'ready';
  const colors = Color.theme(v.theme);

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
      position: 'relative',
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

  const data = {
    ...v,
    runtime,
    session: session.status,
    error: session.status === 'error' ? session.error.message : undefined,
  };

  const reset = () => {
    theme.value = defaults.theme;
    debug.value = defaults.debug;
    loadSession.value = defaults.loadSession;
  };

  return (
    <div className={styles.root.class}>
      <div className={styles.stage.class}>
        <Cropmarks theme={v.theme} borderOpacity={0.12} size={{ mode: 'center', width: 360 }}>
          <PaymentElement.UI
            debug={v.debug}
            theme={v.theme}
            publishableKey={ready ? session.publishableKey : ''}
            clientSecret={ready ? session.clientSecret : undefined}
            onReady={(element) => console.info(`⚡️ onReady:`, element)}
            onChange={(event) => console.info(`⚡️ onChange:`, event)}
            onLoadError={(error) => console.info(`⚡️ onLoadError`, error)}
          />
        </Cropmarks>
        <div className={styles.pie.class}>{'🥧'}</div>
      </div>
      <div className={styles.side.class}>
        <div className={styles.title.class}>{'Stripe.PaymentElement'}</div>
        <Button
          block
          label={() => `theme: ${v.theme}`}
          onClick={() => (theme.value = v.theme === 'Dark' ? 'Light' : 'Dark')}
        />
        <hr />
        <Button block label={() => `debug: ${v.debug}`} onClick={() => Signal.toggle(debug)} />
        <Button
          block
          label={() => `runtime session: ${v.loadSession ? 'enabled' : 'disabled'}`}
          onClick={() => Signal.toggle(loadSession)}
        />
        <Button block label={() => `(reset)`} onClick={reset} />
        <ObjectView name={'debug'} data={data} expand={0} style={{ marginTop: 20 }} />
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
