import { Dev, Spec, Signal } from '../-test.ui.ts';
import { Debug, createDebugSignals } from './-SPEC.Debug.tsx';
import { Sample } from './ui.tsx';

export default Spec.describe('MyComponent', (e) => {
  const debug = createDebugSignals();
  const p = debug.props;

  e.it('init', (e) => {
    const ctx = Spec.ctx(e);

    Signal.effect(() => {
      debug.listen();
      ctx.redraw();
    });

    ctx.subject
      .size()
      .backgroundColor(1)
      .display('grid')
      .render((e) => <Sample debug={debug} />);
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug debug={debug} />);
  });
});
