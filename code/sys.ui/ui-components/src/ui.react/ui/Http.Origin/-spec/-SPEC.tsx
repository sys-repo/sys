import { Harness, Signal, Spec } from '../../-test.ui.ts';
import { D } from '../common.ts';
import { HttpOrigin } from '../mod.ts';
import { createDebugSignals, Debug } from './-SPEC.Debug.tsx';

export default Spec.describe(D.displayName, async (e) => {
  const debug = await createDebugSignals();
  const p = debug.props;

  function Root() {
    return p.controlled.value ? <RootControlled /> : <RootUncontrolled />;
  }

  function RootUncontrolled() {
    const v = Signal.toObject(p);
    const props = debug.controller.view();
    return (
      <HttpOrigin.UI.Uncontrolled
        {...props}
        debug={v.debug}
        theme={v.theme}
        spec={debug.sample()}
        verify={v.verify ? true : undefined}
      />
    );
  }

  function RootControlled() {
    const v = Signal.toObject(p);
    return (
      <HttpOrigin.UI.Controlled
        debug={v.debug}
        theme={v.theme}
        env={p.env}
        spec={debug.sample()}
        verify={v.verify ? true : undefined}
      />
    );
  }

  e.it('init', (e) => {
    const ctx = Spec.ctx(e);

    debug.attach(ctx, {
      subject: { display: 'grid', render: () => <Root /> },
      effects: [
        () => void Harness.Theme.background(ctx, p.theme.value, 1),
        () => {
          ctx.subject.size([p.width.value, null]);
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
