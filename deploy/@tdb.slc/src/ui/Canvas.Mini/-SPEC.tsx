import { Dev, Spec } from '../-test.ui.ts';
import { Debug, createDebugSignals } from './-SPEC.Debug.tsx';
import { CanvasMini } from './mod.ts';
import { Signal } from './common.ts';

export default Spec.describe('Canvas', (e) => {
  const debug = createDebugSignals();
  const p = debug.props;

  e.it('init', (e) => {
    const ctx = Spec.ctx(e);
    Dev.Theme.signalEffect(ctx, debug.props.theme, 1);

    Signal.effect(() => {
      p.width.value;
      ctx.redraw();
    });

    ctx.subject.size([null, null]).render((e) => {
      return <CanvasMini theme={p.theme.value} width={p.width.value} />;
    });
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug ctx={{ debug }} />);
  });
});
