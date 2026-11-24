import { Spec } from '../-test.ui.ts';
import { createDebugSignals, Debug } from './-SPEC.Debug.tsx';
import { Sample } from './ui.tsx';

export default Spec.describe('useSizeObserver', (e) => {
  const debug = createDebugSignals();

  e.it('init', (e) => {
    const ctx = Spec.ctx(e);

    debug.attach(ctx, {
      subject: { size: 'fill', display: 'grid', render: () => <Sample debug={debug} /> },
      effects: [() => {
        debug.rect.value;
        ctx.redraw();
      }],
    });
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug debug={debug} />);
  });
});
