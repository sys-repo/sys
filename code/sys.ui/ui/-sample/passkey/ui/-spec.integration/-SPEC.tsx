import { Harness, Signal, Spec } from '../../-test.ui.ts';
import { D, type t } from './common.ts';
import { Passkey } from '../mod.ts';
import { WebAuthnLink } from '../../-ui.Links.tsx';
import { createDebugSignals, Debug } from './-SPEC.Debug.tsx';

/** Unconnected observations, not a simulated session or a runtime state store. */
const snapshot: t.Passkey.Snapshot = {
  authentication: { kind: 'unknown', summary: 'Passkey operations are not connected' },
  operation: { kind: 'idle' },
  context: {
    webAuthn: { kind: 'unknown', reason: 'Not inspected' },
    verifier: { kind: 'unavailable', reason: 'No verifier connected' },
  },
};

export default Spec.describe(D.displayName, (e) => {
  const contexts = new WeakMap<ReturnType<typeof Spec.ctx>, t.DebugSignals>();

  e.it('init', (e) => {
    const ctx = Spec.ctx(e);
    const debug = debugFor(ctx);
    const p = debug.props;
    // Render props may reset while the context and its effects remain alive.
    Harness.Theme.background(ctx, p.theme.value, 1);
    ctx.host.footer
      .padding([12, 16])
      .render(() => <WebAuthnLink theme={p.theme.value} />);

    ctx.subject
      .size([360, null])
      .display('grid')
      .render(() => <Passkey.UI snapshot={snapshot} debug={p.debug.value} theme={p.theme.value} />);
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug debug={debugFor(ctx)} />);
  });

  /** Cached suites may serve multiple contexts; state/effects belong to each context. */
  function debugFor(ctx: ReturnType<typeof Spec.ctx>): t.DebugSignals {
    const current = contexts.get(ctx);
    if (current) return current;

    const debug = createDebugSignals();
    contexts.set(ctx, debug);
    const stopRedraw = Signal.effect(() => {
      debug.listen();
      void ctx.redraw();
    });
    ctx.dispose$.subscribe(() => {
      stopRedraw();
      debug.dispose();
      contexts.delete(ctx);
    });
    Harness.Theme.signalEffect(ctx, debug.props.theme, 1);
    return debug;
  }
});
