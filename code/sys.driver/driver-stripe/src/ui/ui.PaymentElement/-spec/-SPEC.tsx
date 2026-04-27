import React from 'react';
import { css, Dev, Signal, Spec } from '../../-test.ui.ts';
import { PaymentElement } from '../mod.ts';
import { createDebugSignals, Debug } from './-SPEC.Debug.tsx';
import { loadRuntimeSession, readRuntimeConfig } from './-u.runtimeSession.ts';
import { D } from './common.ts';

type RuntimeSessionState =
  | { readonly status: 'idle' }
  | { readonly status: 'loading' }
  | { readonly status: 'ready'; readonly publishableKey: string; readonly clientSecret: string }
  | { readonly status: 'error'; readonly error: Error };

export default Spec.describe(D.displayName, async (e) => {
  const debug = await createDebugSignals();
  const p = debug.props;
  const runtime = readRuntimeConfig();

  function Root() {
    const v = Signal.toObject(p);
    const loadSession = v.loadSession !== false;
    const session = useRuntimeSession(loadSession, runtime.sessionUrl);
    const ready = session.status === 'ready';

    return (
      <PaymentElement.UI
        debug={v.debug}
        theme={v.theme}
        publishableKey={ready ? session.publishableKey : ''}
        clientSecret={ready ? session.clientSecret : undefined}
        onReady={(element) => console.info(`⚡️ onReady:`, element)}
        onChange={(event) => console.info(`⚡️ onChange:`, event)}
        onLoadError={(error) => console.info(`⚡️ onLoadError`, error)}
      />
    );
  }

  function Pie() {
    const styles = {
      base: css({
        pointerEvents: 'none',
        Absolute: [null, null, 5, 18],
        fontSize: 64,
      }),
    };
    return <div className={styles.base.class}>{'🥧'}</div>;
  }

  e.it('init', (e) => {
    const ctx = Spec.ctx(e);

    update();
    function update() {
      debug.listen();
      ctx.redraw();
    }

    Signal.effect(update);
    Dev.Theme.signalEffect(ctx, p.theme, 1);

    ctx.subject
      .size([360, null])
      .display('grid')
      .render(() => <Root />);

    ctx.host.layer(-1).render(() => <Pie />);
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug debug={debug} />);
  });
});

/**
 * Helpers:
 */
function useRuntimeSession(enabled: boolean, sessionUrl: string): RuntimeSessionState {
  const [state, setState] = React.useState<RuntimeSessionState>({ status: 'idle' });

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
