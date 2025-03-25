import { Dev, Spec, Signal } from '../-test.ui.ts';
import { Debug, createDebugSignals } from './-SPEC.Debug.tsx';
import { MyComponent } from './mod.ts';

export default Spec.describe('MyComponent', (e) => {
  const debug = createDebugSignals();
  const p = debug.props;

  e.it('init', (e) => {
    const ctx = Spec.ctx(e);

    Dev.Theme.signalEffect(ctx, p.theme, 1);
    Signal.effect(() => {
      // 🐷 TODO: read relevant signal values to hook into change monitor.
      p.theme.value;
      ctx.redraw();
    });

    ctx.subject
      .size([224, null])
      .display('grid')
      .render((e) => <MyComponent theme={p.theme.value} />);
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug ctx={{ debug }} />);
  });
});
