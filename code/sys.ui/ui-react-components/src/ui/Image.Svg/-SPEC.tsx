import { Signal, Dev, Spec } from '../-test.ui.ts';
import { Debug, createDebugSignals } from './-SPEC.Debug.tsx';
import { Sample } from './-SPEC.Sample.tsx';

export default Spec.describe('Image.Svg', (e) => {
  const debug = createDebugSignals();
  const p = debug.props;

  e.it('init', (e) => {
    const ctx = Spec.ctx(e);

    Dev.Theme.signalEffect(ctx, p.theme, 1);
    Signal.effect(() => {
      p.width.value;
      p.fill.value;

      if (p.fill.value) ctx.subject.size('fill');
      else ctx.subject.size([null, null]);

      ctx.redraw();
    });

    ctx.subject.size([null, null]).render((e) => {
      return <Sample signals={debug} />;
    });
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug ctx={{ debug }} />);
  });
});
