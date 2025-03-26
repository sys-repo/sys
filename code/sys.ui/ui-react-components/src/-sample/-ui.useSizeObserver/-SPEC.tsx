import { Dev, Spec, Signal } from '../-test.ui.ts';
import { Debug, createDebugSignals } from './-SPEC.Debug.tsx';
import { Sample } from './ui.tsx';

export default Spec.describe('useSizeObserver', (e) => {
  const debug = createDebugSignals();
  const p = debug.props;

  e.it('init', (e) => {
    const ctx = Spec.ctx(e);

    Signal.effect(() => {
      // p.theme.value;
      ctx.redraw();
    });

    ctx.subject
      .size('fill')
      .display('grid')
      .render((e) => {
        return <Sample />;
      });
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug debug={debug} />);
  });
});
