import { Harness, Signal, Spec } from '../../../-test.ui.ts';
import { D, type t } from './common.ts';
import { Controller } from '../../ui.controller/mod.ts';
import { WebAuthnLink } from '../-spec/-ui.Links.tsx';
import { createDebugSignals, Debug } from './-SPEC.Debug.tsx';
import { SpecLink } from '../-spec/-ui.Links.tsx';

type Context = ReturnType<typeof Spec.ctx>;
type Owner = {
  debug: ReturnType<typeof createDebugSignals>;
  controller: t.Controller.Instance;
};

export default Spec.describe(D.displayName, (e) => {
  const contexts = new WeakMap<Context, Owner>();

  e.it('init', (e) => {
    const ctx = Spec.ctx(e);
    if (!ctx.is.attachable) return;
    const owner = contexts.get(ctx) ?? openOwner(ctx);
    if (!owner) return;
    const { debug, controller } = owner;
    const p = debug.props;
    // Render props may reset while the context and its effects remain alive.
    Harness.Theme.background(ctx, p.theme.value, 1);
    ctx.host.footer
      .padding([12, 16])
      .render(() => <WebAuthnLink theme={p.theme.value} />);

    // Center a fixed preview area so content grows down without moving the panel’s top.
    ctx.subject
      .size([360, 500])
      .render(() => {
        const { view, debug, theme } = Signal.toObject(p);
        return <Controller.UI controller={controller} view={view} debug={debug} theme={theme} />;
      });

    ctx.debug.footer.padding(10).render(() => <SpecLink to='view' />);
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    const owner = contexts.get(ctx);
    if (!owner || !ctx.is.attachable) return;
    ctx.debug.row(<Debug debug={owner.debug} controller={owner.controller} />);
  });

  /** Cached suites may serve multiple contexts; state/effects belong to each context. */
  function openOwner(ctx: Context) {
    const effects = Signal.listeners(ctx.dispose$);
    const debug = createDebugSignals();
    const controller = Controller.open();
    contexts.set(ctx, { debug, controller });
    effects.dispose$.subscribe(() => {
      contexts.delete(ctx);
      controller.dispose();
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
