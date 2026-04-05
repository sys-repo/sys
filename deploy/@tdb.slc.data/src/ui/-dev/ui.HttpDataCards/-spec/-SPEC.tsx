import { Dev, Signal, Spec } from '../../../-test.ui.ts';
import { type t, D, Is } from './common.ts';
import { HttpDataCards } from '../mod.ts';
import { Debug, createDebugSignals } from './-SPEC.Debug.tsx';

export default Spec.describe(D.displayName, async (e) => {
  const debug = await createDebugSignals();
  const p = debug.props;

  function Root() {
    const v = Signal.toObject(p);
    const origin = wrangle.origin(v.origin);
    return (
      <HttpDataCards.UI
        debug={v.debug}
        theme={v.theme}
        origin={origin}
        dataset={v.dataset}
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
      .size([420, null])
      .display('grid')
      .render(() => <Root />);

    ctx.debug.width(460);
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug debug={debug} />);
  });
});

const wrangle = {
  origin(input: t.UrlTree | undefined): t.StringUrl | undefined {
    if (Is.str(input)) return input;
    if (!input || !Is.object(input)) return undefined;
    const proxy = 'proxy' in input ? input.proxy : undefined;
    return Is.str(proxy) ? proxy : undefined;
  },
} as const;
