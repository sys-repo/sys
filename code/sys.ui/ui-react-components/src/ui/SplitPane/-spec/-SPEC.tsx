import { Dev, Signal, Spec } from '../../-test.ui.ts';
import { D } from '../common.ts';
import { SplitPane } from '../mod.ts';
import { Debug, createDebugSignals } from './-SPEC.Debug.tsx';

export default Spec.describe(D.displayName, (e) => {
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
      .size('fill', 100)
      .display('grid')
      .render(() => {
        const v = Signal.toObject(p);
        return (
          <SplitPane
            debug={v.debug}
            theme={v.theme}
            enabled={v.enabled}
            orientation={v.orientation}
            defaultValue={v.defaultValue}
            min={v.min}
            max={v.max}
            gutter={v.gutter}
          />
        );
      });
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug debug={debug} />);
  });
});
