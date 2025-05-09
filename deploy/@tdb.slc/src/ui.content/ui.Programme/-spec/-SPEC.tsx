import { Dev, Signal, Spec } from '../../-test.ui.ts';
import { App, D } from '../common.ts';
import { Programme } from '../mod.ts';
import { Debug, createDebugSignals } from './-SPEC.Debug.tsx';

export default Spec.describe(D.name, async (e) => {
  const debug = createDebugSignals();

  e.it('init', (e) => {
    const ctx = Spec.ctx(e);
    App.Render.preloadTimestamps(debug.content);
    Dev.Theme.signalEffect(ctx, debug.props.theme, 1);
    Signal.effect(() => {
      debug.listen();
      ctx.redraw();
    });

    ctx.subject
      .size('fill')
      .display('grid')
      .render(() => {
        return (
          <Programme.View.Main
            state={debug.state}
            content={debug.content}
            theme={'Light'}
            onReady={(e) => console.info(`⚡️ onReady:`, e)}
          />
        );
      });

    /**
     * Initial state:
     */
    const p = debug.state.props;
    p.debug.value = true;
    p.align.value = 'Right';
    p.section.value = { index: 0, childIndex: 0 };
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug debug={debug} />);
  });
});
