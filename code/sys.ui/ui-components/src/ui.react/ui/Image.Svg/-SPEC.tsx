import { Harness, Spec } from '../-test.ui.ts';
import { createDebugSignals, Debug } from './-SPEC.Debug.tsx';
import { Sample } from './-SPEC.Sample.tsx';

export default Spec.describe('Image.Svg', (e) => {
  const debug = createDebugSignals();
  const p = debug.props;

  function Root() {
    return <Sample signals={debug} />;
  }

  e.it('init', (e) => {
    const ctx = Spec.ctx(e);

    debug.attach(ctx, {
      subject: { display: 'grid', render: () => <Root /> },
      effects: [
        () => void Harness.Theme.background(ctx, p.theme.value, 1),
        () => {
          debug.listen();
          const width = p.width.value;
          if (width === undefined) ctx.subject.size('fill');
          else ctx.subject.size([width, null]);
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
