import { Dev, Signal, Spec } from '../-test.ui.ts';
import { Debug, createDebugSignals } from './-SPEC.Debug.tsx';
import { Layout } from './mod.ts';

export default Spec.describe('MobileLayout', (e) => {
  const debug = createDebugSignals();
  const p = debug.props;

  e.it('init', (e) => {
    const ctx = Spec.ctx(e);

    const updateSize = () => {
      const breakpoint = p.breakpoint.value;
      if (breakpoint === 'Mobile') ctx.subject.size([390, 844]);
      if (breakpoint === 'Intermediate') ctx.subject.size([600, 650]);
      if (breakpoint === 'Desktop') ctx.subject.size('fill');
    };

    Dev.Theme.signalEffect(ctx, p.signals.theme, 1);
    Signal.effect(() => {
      debug.listen();
      updateSize();
      ctx.redraw();
    });

    ctx.subject
      .size()
      .display('grid')
      .render((e) => Layout.render(p.breakpoint.value, p.signals));

    updateSize();
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug debug={debug} />);
  });
});
