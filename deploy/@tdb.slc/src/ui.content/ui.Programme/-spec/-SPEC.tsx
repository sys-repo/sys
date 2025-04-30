import { Dev, Signal, Spec } from '../../-test.ui.ts';
import { D } from '../common.ts';
import { Programme } from '../mod.ts';
import { Debug, createDebugSignals } from './-SPEC.Debug.tsx';

export default Spec.describe(D.name, async (e) => {
  const debug = createDebugSignals();

  e.it('init', (e) => {
    const ctx = Spec.ctx(e);

    Dev.Theme.signalEffect(ctx, debug.props.theme, 1);
    Signal.effect(() => {
      debug.listen();
      ctx.redraw();
    });

    ctx.subject
      .size('fill')
      .display('grid')
      .render(() => {
        const state = debug.content.state;
        return <Programme.View.Main content={debug.content} state={state} theme={'Light'} />;
      });

    /**
     * Initial state:
     */
    const p = debug.content.state.props;
    p.debug.value = true;
    p.align.value = 'Right';
    p.section.value = { index: 0, childIndex: 0 };
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug debug={debug} />);
  });
});
