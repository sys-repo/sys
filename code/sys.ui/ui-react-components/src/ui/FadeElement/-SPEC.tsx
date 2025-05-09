import { Dev, Signal, Spec } from '../-test.ui.ts';
import { Debug, createDebugSignals } from './-SPEC.Debug.tsx';
import { FadeElement } from './mod.ts';

export default Spec.describe('FadeElement', (e) => {
  const debug = createDebugSignals();
  const p = debug.props;

  e.it('init', (e) => {
    const ctx = Spec.ctx(e);

    Dev.Theme.signalEffect(ctx, p.theme, 1);
    Signal.effect(() => {
      debug.listen();
      ctx.subject.size(p.fixedSize.value ? [390, 200] : [null, null]);
      ctx.redraw();
    });

    ctx.subject
      .display('grid')
      .render(() => <FadeElement duration={p.duration.value} children={p.children.value} />);
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug debug={debug} />);
  });
});
