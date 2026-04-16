import { Dev, Signal, Spec } from '../../../-test.ui.ts';
import { type t, D, Is } from './common.ts';
import { HttpDataCards } from '../mod.ts';
import { Debug, createDebugSignals } from './-SPEC.Debug.tsx';

export const createSpec: t.DevSpec.Loader.Factory<t.HttpDataCards.Spec.Params | void> = (
  params = {},
) => {
  const debug = createDebugSignals(params);
  const p = debug.props;

  return Spec.describe(D.displayName, async (e) => {
    function Root() {
      const v = Signal.toObject(p);
      const origin = wrangle.origin(v.origin);
      return (
        <HttpDataCards.UI debug={v.debug} theme={v.theme} origin={origin} dataset={v.dataset} />
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

      ctx.debug.width(params?.debugWidth ?? 480);
      ctx.subject
        .size([420, null])
        .display('grid')
        .render(() => <Root />);
    });

    e.it('ui:debug', (e) => {
      const ctx = Spec.ctx(e);
      ctx.debug.row(<Debug debug={debug} />);
    });
  });
};

export default createSpec();

const wrangle = {
  origin(input: t.UrlTree | undefined): t.StringUrl | undefined {
    if (Is.str(input)) return input;
    if (!input || !Is.object(input)) return undefined;
    const proxy = 'proxy' in input ? input.proxy : undefined;
    return Is.str(proxy) ? proxy : undefined;
  },
} as const;
