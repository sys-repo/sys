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
      .render(() => <Root content={debug.content} state={debug.state} video={debug.video} />);

    /**
     * Initial state:
     */
    const p = debug.state.props;
    p.debug.value = true;
    p.section.value = { index: 0 };
    debug.props.theme.value = 'Light';
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug debug={debug} />);
  });
});
