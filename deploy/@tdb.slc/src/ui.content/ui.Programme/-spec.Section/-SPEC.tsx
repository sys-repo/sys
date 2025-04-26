import { Dev, Spec } from '../../-test.ui.ts';
import { Signal } from '../common.ts';
import { createDebugSignals, Debug } from './-SPEC.Debug.tsx';
import { Root } from './-SPEC.ui.tsx';

export default Spec.describe('MyComponent', (e) => {
  const debug = createDebugSignals();
  const p = debug.props;

  e.it('init', (e) => {
    const ctx = Spec.ctx(e);

    Dev.Theme.signalEffect(ctx, p.theme);
    Signal.effect(() => {
      debug.listen();
      ctx.redraw();
    });

    ctx.subject
      .size('fill-y')
      .display('grid')
      .render(() => <Root state={debug.state.component} />);

    /**
     * Initial state:
     */
    p.theme.value = 'Light';
    // debug.state.component.props.section.value = { index: 0 };
    // debug.state.component.props.
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug debug={debug} />);
  });
});
