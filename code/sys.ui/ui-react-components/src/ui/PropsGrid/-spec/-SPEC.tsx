import { Dev, Signal, Spec } from '../../-test.ui.ts';
import { D } from '../common.ts';
import { PropsGrid } from '../mod.ts';
import { Debug, createDebugSignals } from './-SPEC.Debug.tsx';

export default Spec.describe(D.displayName, (e) => {
  const debug = createDebugSignals();
  const p = debug.props;

  e.it('init', (e) => {
    const ctx = Spec.ctx(e);

    const update = () => {
      const width = p.width.value;
      ctx.subject.size([width, null]);
      ctx.redraw();
    };

    Dev.Theme.signalEffect(ctx, p.theme, 1);
    Signal.effect(() => {
      debug.listen();
      update();
    });

    ctx.subject
      .size()
      .display('grid')
      .render(() => <PropsGrid debug={p.debug.value} theme={p.theme.value} />);

    // Init:
    update();
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug debug={debug} />);
  });
});
