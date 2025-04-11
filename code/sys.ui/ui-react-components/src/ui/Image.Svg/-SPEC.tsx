import { Dev, Signal, Spec } from '../-test.ui.ts';
import { Debug, createDebugSignals } from './-SPEC.Debug.tsx';
import { Sample } from './-SPEC.Sample.tsx';

export default Spec.describe('Image.Svg', (e) => {
  const debug = createDebugSignals();
  const p = debug.props;

  e.it('init', (e) => {
    const ctx = Spec.ctx(e);

    const updateSize = () => {
      const width = p.width.value;
      if (width === undefined) ctx.subject.size('fill');
      else ctx.subject.size([width, null]);
    };

    Dev.Theme.signalEffect(ctx, p.theme, 1);
    Signal.effect(() => {
      debug.listen();
      updateSize();
      ctx.redraw();
    });

    ctx.subject.display('grid').render((e) => {
      return <Sample signals={debug} />;
    });
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug debug={debug} />);
  });
});
