import { Dev, Spec } from '../../-test.ui.ts';
import { Signal } from '../common.ts';
import { createDebugSignals, Debug } from './-SPEC.Debug.tsx';
import { Root } from './-SPEC.ui.tsx';

export default Spec.describe('MyComponent', (e) => {
  const debug = createDebugSignals();

  e.it('init', (e) => {
    const ctx = Spec.ctx(e);

    Dev.Theme.signalEffect(ctx, debug.props.theme);
    Signal.effect(() => {
      debug.listen();
      ctx.redraw();
    });

    ctx.subject
      .size('fill-y')
      .display('grid')
      .render(() => <Root state={debug.content.state} />);

    /**
     * Initial state:
     */
    debug.props.theme.value = 'Light';
    debug.content.state.props.section.value = { index: 0 };
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug debug={debug} />);
  });
});
