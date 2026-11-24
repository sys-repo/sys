import { Harness, Spec } from '../-test.ui.ts';
import { createDebugSignals, Debug } from './-SPEC.Debug.tsx';
import { Bullet } from './mod.ts';

export default Spec.describe('Bullet', (e) => {
  const debug = createDebugSignals();
  const p = debug.props;

  e.it('init', (e) => {
    const ctx = Spec.ctx(e);

    debug.attach(ctx, {
      subject: {
        size: undefined,
        display: 'grid',
        render() {
          return (
            <Bullet
              theme={p.theme.value}
              size={p.size.value}
              selected={p.selected.value}
              filled={p.filled.value}
            />
          );
        },
      },
      effects: [
        () => void Harness.Theme.background(ctx, p.theme.value),
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
