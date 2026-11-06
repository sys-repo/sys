import { Harness, Signal, Spec } from '../../-test.ui.ts';
import { Color, css, D, type t } from './common.ts';
import { WebAuthnLink } from '../../-ui.Links.tsx';
import { createDebugSignals, Debug } from './-SPEC.Debug.tsx';

export default Spec.describe(D.displayName, (e) => {
  const contexts = new WeakMap<ReturnType<typeof Spec.ctx>, t.DebugSignals>();

  function Root({ debug }: t.DebugProps) {
    const v = Signal.toObject(debug.props);
    const style = css({ color: Color.theme(v.theme).fg, padding: 20 });
    return <div className={style.class}>Hello world</div>;
  }

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
      .render(() => <Root debug={debug} />);
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
