import { Dev, Signal, Spec } from '../../-test.ui.ts';
import { D, type t } from './common.ts';
import { Switches } from '../mod.ts';
import { createDebugSignals, Debug } from './-SPEC.Debug.tsx';
import { SAMPLE } from './-samples.tsx';

export default Spec.describe(D.displayName, async (e) => {
  const debug = await createDebugSignals();
  const p = debug.props;

  function Root() {
    const v = Signal.toObject(p);
    const currentItems = p.items.value ?? SAMPLE.source(v.sample);
    const items = SAMPLE.withValues(currentItems, {
      values: v.values,
      onToggle: (e) => (p.values.value = { ...p.values.value, [e.item.id]: e.next }),
    });

    const onReorder: t.KeyValue.Reorder.ChangeHandler = (e) => {
      p.items.value = SAMPLE.reorder(currentItems, e.next);
    };

    return (
      <Switches.UI
        debug={v.debug}
        theme={v.theme}
        enabled={v.enabled}
        reorder={v.reorder ? { onChange: onReorder } : undefined}
        focus={{
          enabled: v.focus.enabled,
          model: v.focus.model,
          onChange: (e) => p.focus.model.value = e.next,
        }}
        items={items}
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
