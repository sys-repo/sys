import { Harness, Signal, Spec } from '../../-test.ui.ts';
import { D, type t } from './common.ts';
import { Tabs } from '../mod.ts';
import { createDebugSignals, Debug } from './-SPEC.Debug.tsx';
import { Foo } from './-ui.Foo.tsx';

export default Spec.describe(D.displayName, async (e) => {
  const debug = await createDebugSignals();
  const p = debug.props;

  function Root() {
    const v = Signal.toObject(p);

    const items = Array.from({ length: v.totalTabs ?? 0 }).map((_, i) => {
      const tab: t.Tabs.Item = {
        id: `tab-${i + 1}`,
        label: `Tab ${i + 1}`,
        render: () => <Foo tab={tab} theme={v.theme} />,
      };
      return tab;
    });

    return (
      <Tabs.UI
        debug={v.debug}
        theme={v.theme}
        items={items}
        value={v.value}
        parts={{ body: { padding: 20, scroll: true } }}
        onChange={(e) => {
          console.info(`⚡️ onChange:`, e);
          p.value.value = e.id;
        }}
      />
    );
  }

  e.it('init', (e) => {
    const ctx = Spec.ctx(e);
    debug.attach(ctx, {
      subject: { size: 'fill', margin: 100, display: 'grid', render: () => <Root /> },
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
