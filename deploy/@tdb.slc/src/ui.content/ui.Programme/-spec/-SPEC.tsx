import { type t, Dev, Signal, Spec } from '../../-test.ui.ts';
import { Debug, createDebugSignals } from './-SPEC.Debug.tsx';
import { Programme } from '../mod.ts';

export default Spec.describe('MyComponent', async (e) => {
  const debug = createDebugSignals();
  const p = debug.props;

  e.it('init', (e) => {
    const ctx = Spec.ctx(e);
    const content = Programme.factory(); // Content Factory 🌳

    Dev.Theme.signalEffect(ctx, p.theme, 1);
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
            index={0}
            is={{ top: false, bottom: false }}
            state={debug.app}
            content={content}
            theme={'Light'}
          />
        );
      });

    /**
     * Initial:
     */
    console.info('💦 content:Programme:', content);
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug debug={debug} />);
  });
});
