import { Harness, Signal, Spec } from '../../../-test.ui.ts';
import { D } from './common.ts';
import { openSample } from '../../ui.host/u.sample.ts';
import { Connected } from '../../ui.host/ui.Connected.tsx';
import { WebAuthnLink } from '../-spec/-ui.Links.tsx';
import { createDebugSignals, Debug } from './-SPEC.Debug.tsx';

export default Spec.describe(D.displayName, (e) => {
  type Context = ReturnType<typeof Spec.ctx>;
  type Owner = {
    debug: ReturnType<typeof createDebugSignals>;
    sample: ReturnType<typeof openSample>;
  };
  const contexts = new WeakMap<Context, Owner>();

  e.it('init', (e) => {
    const ctx = Spec.ctx(e);
    if (!ctx.is.attachable) return;
    const owner = contexts.get(ctx) ?? openOwner(ctx);
    if (!owner) return;
    const { debug, sample } = owner;
    const p = debug.props;
    // Render props may reset while the context and its effects remain alive.
    Harness.Theme.background(ctx, p.theme.value, 1);
    ctx.host.footer
      .padding([12, 16])
      .render(() => <WebAuthnLink theme={p.theme.value} />);

    ctx.subject
      .size([360, null])
      .display('grid')
      .render(() => <Connected sample={sample} debug={p.debug.value} theme={p.theme.value} />);
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    const owner = contexts.get(ctx);
    if (owner && ctx.is.attachable) ctx.debug.row(<Debug debug={owner.debug} />);
  });

  /** Cached suites may serve multiple contexts; state/effects belong to each context. */
  function openOwner(ctx: Context) {
    const effects = Signal.listeners(ctx.dispose$);
    const debug = createDebugSignals();
    const sample = openSample();
    contexts.set(ctx, { debug, sample });
    effects.dispose$.subscribe(() => {
      contexts.delete(ctx);
      sample.dispose();
      debug.dispose();
    });
    effects.effect(() => {
      debug.listen();
      Harness.Theme.background(ctx, debug.props.theme.value, 1);
      void ctx.redraw();
    });
    // The initial redraw may already have disposed the context.
    return contexts.get(ctx);
  }
});
