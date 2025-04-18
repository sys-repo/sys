import { Dev, Spec, Signal } from '../-test.ui.ts';
import { Debug, createDebugSignals } from './-SPEC.Debug.tsx';
import { Landing, signalsFactory } from './mod.ts';

export default Spec.describe('Landing', (e) => {
  const debug = createDebugSignals();
  const landing = signalsFactory();
  const d = debug.props;
  const p = landing.props;

  e.it('init', (e) => {
    const ctx = Spec.ctx(e);
    Dev.Theme.signalEffect(ctx, d.theme, 1);
    Signal.effect(() => {
      p.ready.value;
      p.sidebarVisible.value;
      ctx.redraw();
    });

    ctx.subject
      .size('fill')
      .display('grid')
      .render((e) => {
        return <Landing theme={d.theme.value} signals={landing} />;
      });
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug ctx={{ debug, landing }} />);
  });
});
