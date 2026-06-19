import { Dev, Signal, Spec } from '../../-test.ui.ts';
import { D, type t } from './common.ts';
import { Switches } from '../mod.ts';
import { Debug, createDebugSignals } from './-SPEC.Debug.tsx';
import { SAMPLE } from './-samples.tsx';

export default Spec.describe(D.displayName, async (e) => {
  const debug = await createDebugSignals();
  const p = debug.props;

  function Root() {
    const v = Signal.toObject(p);
    const currentItems = p.items.value ?? SAMPLE.source(v.sample);
    const items = SAMPLE.withValues(currentItems, {
      values: v.values,
      onToggle: (id, next) => (p.values.value = { ...p.values.value, [id]: next }),
    });

    const onReorderChange: t.KeyValue.Reorder.Handler = (e) => {
      p.items.value = SAMPLE.reorder(currentItems, e.next);
    };

    const reorder: t.KeyValue.Reorder | undefined = v.reorder
      ? { onChange: onReorderChange }
      : undefined;

    return (
      <Switches.UI
        debug={v.debug}
        theme={v.theme}
        enabled={v.enabled}
        reorder={reorder}
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
