import { Dev, Signal, Spec } from '../-test.ui.ts';
import { Debug, createDebugSignals } from './-SPEC.Debug.tsx';
import { updateForBreakpointSize } from './-SPEC.u.tsx';
import { Color, css } from './common.ts';
import { Layout } from './mod.ts';

export * from './-SPEC.u.tsx';

export default Spec.describe('MobileLayout', async (e) => {
  const debug = await createDebugSignals();
  const app = debug.app;
  const p = app.props;

  e.it('init', (e) => {
    const ctx = Spec.ctx(e);
    const update = { size: () => updateForBreakpointSize(ctx, app) };

    Dev.Theme.signalEffect(ctx, debug.props.theme, 1);
    Signal.effect(() => {
      debug.listen();
      update.size();
      ctx.redraw();
    });

    ctx.host.tracelineColor(Color.alpha(Color.CYAN, 0.3));
    ctx.subject
      .size()
      .display('grid')
      .render((e) => {
        const style = css({ display: 'grid', overflow: 'hidden' });
        const el = Layout.render(p.screen.breakpoint.value, debug.app);
        return <div className={style.class}>{el}</div>;
      });

    update.size();
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug debug={debug} />);
  });
});
