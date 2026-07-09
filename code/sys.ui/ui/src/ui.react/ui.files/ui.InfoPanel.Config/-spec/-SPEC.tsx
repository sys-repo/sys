import { D, Dev, Signal, Spec } from './common.ts';
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
        fields={v.fields}
        focus={{
          enabled: v.focus.enabled,
          model: v.focus.model,
          entry: 'option-click',
          navigation: 'keyboard',
          onChange(e) {
            console.info(`⚡️ ${D.name}.focus.onChange:`, e);
            p.focus.model.value = e.next;
          },
        }}
        onFieldsChange={(e) => {
          console.info(`⚡️ ${D.name}.onFieldsChange:`, e);
          p.fields.value = e.next;
        }}
      />
    );
  }

  e.it('init', (e) => {
    const ctx = Spec.ctx(e);

    update();
    function update() {
      debug.listen();
      ctx.redraw();
    }

    Signal.effect(update);
    Dev.Theme.signalEffect(ctx, p.theme, 1);

    ctx.subject
      .size([360, null])
      .display('grid')
      .render(() => <Root />);
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug debug={debug} />);
  });
});
