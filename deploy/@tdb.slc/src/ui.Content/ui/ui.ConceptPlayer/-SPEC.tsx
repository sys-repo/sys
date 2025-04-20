import { Dev, Spec, Signal } from '../../-test.ui.ts';
import { Debug, createDebugSignals } from './-SPEC.Debug.tsx';
import { ConceptPlayer } from './mod.ts';
import { Color, LayoutGroup } from './common.ts';

export default Spec.describe('ConceptPlayer', (e) => {
  const debug = createDebugSignals();
  const p = debug.props;

  e.it('init', (e) => {
    const ctx = Spec.ctx(e);

    Dev.Theme.signalEffect(ctx, p.theme);
    Signal.effect(() => {
      ctx.host.tracelineColor(Color.alpha(Color.CYAN, 0.5));
      debug.listen();
      ctx.redraw();
    });

    ctx.subject
      .size('fill')
      .display('grid')
      .render((e) => (
        <LayoutGroup>
          <ConceptPlayer theme={p.theme.value} debug={p.debug.value} column={p.column.value} />
        </LayoutGroup>
      ));
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug debug={debug} />);
  });
});
