import { Dev, Signal, Spec } from '../../-test.ui.ts';
import { MonacoEditor } from '../mod.ts';
import { Debug, createDebugSignals } from './-SPEC.Debug.tsx';

export default Spec.describe('MonacoEditor', (e) => {
  const debug = createDebugSignals();
  const p = debug.props;

  e.it('init', (e) => {
    const ctx = Spec.ctx(e);

    Dev.Theme.signalEffect(ctx, p.theme, 1);
    Signal.effect(() => {
      debug.listen();
      ctx.redraw();
    });

    ctx.subject
      .size('fill')
      .display('grid')
      .render(() => {
        if (!p.render.value) return null;

        return (
          <MonacoEditor
            debug={p.debug.value}
            theme={p.theme.value}
            enabled={p.enabled.value}
            minimap={p.minimap.value}
            readOnly={p.readOnly.value}
          />
        );
      });
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug debug={debug} />);
  });
});
