import { Spec } from '../-test.ui.ts';
import { createDebugSignals, Debug } from './-SPEC.Debug.tsx';
import { Sample } from './ui.tsx';

export default Spec.describe('MyComponent', (e) => {
  const debug = createDebugSignals();

  e.it('init', (e) => {
    const ctx = Spec.ctx(e);
    debug.attach(ctx, {
      subject: { size: undefined, display: 'grid', render: () => <Sample debug={debug} /> },
      effects: [
        () => void ctx.subject.backgroundColor(1),
        () => {
          debug.listen();
          ctx.redraw();
        },
      ],
    });

    ctx.debug.footer
      .border(-0.1)
      .padding(0)
      .render(() => <Sample debug={debug} />);
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug debug={debug} />);
  });
});
