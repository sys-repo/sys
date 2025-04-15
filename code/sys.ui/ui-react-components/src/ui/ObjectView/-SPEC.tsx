import { Dev, Signal, Spec } from '../-test.ui.ts';
import { Debug, createDebugSignals } from './-SPEC.Debug.tsx';
import { ObjectView } from './mod.ts';

export default Spec.describe('Obj', (e) => {
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
      .size()
      .display('grid')
      .render((e) => {
        const paths = p.expandPaths.value;
        return (
          <ObjectView
            theme={p.theme.value}
            fontSize={p.fontSize.value}
            name={p.name.value}
            data={p.data.value}
            sortKeys={p.sortKeys.value}
            show={debug.show}
            expand={{ paths }}
          />
        );
      });
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug debug={debug} />);
  });
});
