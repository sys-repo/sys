import { D, Harness, Signal, Spec } from './common.ts';
import { InfoPanelConfig } from '../mod.ts';
import { createDebugSignals, Debug } from './-SPEC.Debug.tsx';

export default Spec.describe(D.displayName, async (e) => {
  const debug = await createDebugSignals();
  const p = debug.props;

  function Root() {
    const v = Signal.toObject(p);
    return (
      <InfoPanelConfig.UI
        debug={v.debug}
        theme={v.theme}
        reorder={v.reorder}
        items={v.items}
        cursor={{
          enabled: v.cursor.enabled,
          model: v.cursor.model,
          entry: 'option-click',
          navigation: 'keyboard',
          onChange(e) {
            console.info(`⚡️ ${D.name}.cursor.onChange:`, e);
            p.cursor.model.value = e.next;
          },
        }}
        onItemsChange={(e) => {
          console.info(`⚡️ ${D.name}.onItemsChange:`, e);
          p.items.value = e.next;
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
