import { EventsView } from '@sys/ui-components/react/event';
import { Harness, Signal, Spec } from '../../-test.ui.ts';
import { createDebugSignals, Debug } from './-SPEC.Debug.tsx';
import { samples } from './-u.samples.ts';
import { D } from './common.ts';

export default Spec.describe(D.displayName, async (e) => {
  const debug = await createDebugSignals();
  const p = debug.props;

  function Root() {
    const v = Signal.toObject(p);
    return (
      <EventsView.UI
        items={samples[v.sample].items}
        tail={v.tail}
        renderItem={v.showMessage ? (event) => event.message : undefined}
        labels={v.customLabels ? { latest: 'Last seen', events: 'History' } : undefined}
        theme={v.theme}
        mode={v.mode}
        mono={v.mono}
        debug={v.debug}
      />
    );
  }

  e.it('init', (e) => {
    const ctx = Spec.ctx(e);

    debug.attach(ctx, {
      subject: { size: [280, null], display: 'grid', render: () => <Root /> },
      effects: [
        () => void Harness.Theme.background(ctx, p.theme.value, 1),
        () => {
          debug.listen();
          void ctx.redraw();
        },
      ],
    });
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug debug={debug} />);
  });
});
