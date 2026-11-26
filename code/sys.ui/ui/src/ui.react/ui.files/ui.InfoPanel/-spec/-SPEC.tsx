import { D, Harness, Spec } from './common.ts';
import { Files } from '../../mod.ts';
import { createDebugSignals, Debug } from './-SPEC.Debug.tsx';
import { connect, disconnect } from './-u.connect.ts';

export default Spec.describe(D.displayName, async (e) => {
  const debug = await createDebugSignals();
  const p = debug.props;

  function Root() {
    const v = debug.controller.view();
    return (
      <Files.InfoPanel.UI.Uncontrolled
        {...v}
        title={p.title.value}
        animation={p.animation.value}
        fields={p.fields.value}
        transport={{
          onConnect: () => void connect(debug),
          onDisconnect: () => void disconnect(debug),
        }}
      />
    );
  }

  e.it('init', (e) => {
    const ctx = Spec.ctx(e);

    debug.attach(ctx, {
      subject: { size: [360, null], display: 'grid', render: () => <Root /> },
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
