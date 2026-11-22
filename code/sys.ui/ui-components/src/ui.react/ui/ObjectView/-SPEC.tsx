import { Harness, Spec } from '../-test.ui.ts';
import { createDebugSignals, Debug } from './-SPEC.Debug.tsx';
import { ObjectView } from './mod.ts';

export default Spec.describe('Obj', (e) => {
  const debug = createDebugSignals();
  const p = debug.props;

  function Root() {
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
  }

  e.it('init', (e) => {
    const ctx = Spec.ctx(e);
    debug.attach(ctx, {
      subject: { size: undefined, display: 'grid', render: () => <Root /> },
      effects: [
        () => void Harness.Theme.background(ctx, p.theme.value, 1),
        () => {
          debug.listen();
          ctx.redraw();
        },
      ],
    });
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug debug={debug} />);
  });
});
