import { Harness, Signal, Spec } from '../-test.ui.ts';
import { createDebugSignals, Debug } from './-SPEC.Debug.tsx';
import { Image } from './mod.ts';

export default Spec.describe('Image', (e) => {
  const debug = createDebugSignals();
  const p = debug.props;

  e.it('init', (e) => {
    const ctx = Spec.ctx(e);

    Harness.Theme.signalEffect(ctx, p.theme, 1);
    Signal.effect(() => {
      debug.listen();
      ctx.redraw();
    });

    ctx.subject
      .size('fill', [150, 100])
      .display('grid')
      .render((e) => {
        return <Image.View theme={p.theme.value} src={p.src.value} padding={p.padding.value} />;
      });
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug debug={debug} />);
  });
});
