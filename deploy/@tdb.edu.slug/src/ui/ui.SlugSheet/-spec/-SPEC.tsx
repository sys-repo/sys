import { Dev, Signal, Spec } from '../../-test.ui.ts';
import { D } from '../common.ts';
import { SlugSheet } from '../mod.ts';
import { Debug, createDebugSignals } from './-SPEC.Debug.tsx';
import { createSlots } from './u.fixture.tsx';

export default Spec.describe(D.displayName, async (e) => {
  const debug = await createDebugSignals();
  const p = debug.props;

  function Root() {
    const v = Signal.toObject(p);
    const slots = createSlots(v.slots, v.theme || 'Light');
    return <SlugSheet.UI debug={v.debug} theme={v.theme} slots={slots} />;
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
      .size('fill', 80)
      .display('grid')
      .render(() => <Root />);
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug debug={debug} />);
  });
});
