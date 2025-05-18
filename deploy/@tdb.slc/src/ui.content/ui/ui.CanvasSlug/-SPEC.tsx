import { Dev, Signal, Spec } from '../../-test.ui.ts';
import { Debug, createDebugSignals } from './-SPEC.Debug.tsx';
import { CanvasSlug } from './mod.ts';

export default Spec.describe('CanvasSlug', (e) => {
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
      .size('fill-y', 150)
      .display('grid')
      .render((e) => (
        <CanvasSlug
          style={{ width: 390 }}
          debug={p.debug.value}
          theme={p.theme.value}
          selected={p.selected.value}
          logo={p.logo.value}
          text={p.text.value}
        />
      ));
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug debug={debug} />);
  });
});
