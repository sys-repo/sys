import { Dev, Spec, Signal } from '../../../ui/-test.ui.ts';
import { Debug, createDebugSignals } from './-SPEC.Debug.tsx';
import { Container } from './mod.ts';

export default Spec.describe('css:container-type', (e) => {
  const debug = createDebugSignals();
  const p = debug.props;

  e.it('init', (e) => {
    const ctx = Spec.ctx(e);

    Dev.Theme.signalEffect(ctx, p.theme, 1);
    Signal.effect(() => {
      // 🐷 TODO: hook into signals here.
      ctx.redraw();
    });

    ctx.subject
      .size('fill')
      .display('grid')
      .render((e) => <Container theme={p.theme.value} />);
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug ctx={{ debug }} />);
  });
});
