import { Dev, Signal, Spec } from '../../../-test.ui.ts';
import { type t, D } from './common.ts';
import { DevCrdt } from '../mod.ts';
import { Debug, createDebugSignals } from './-SPEC.Debug.tsx';
import { RepoFooter } from './-u.repo.footer.tsx';
import { createDevRepo } from './-u.repo.ts';

export default Spec.describe(D.displayName, async (e) => {
  const debug = await createDebugSignals();
  const repo = createDevRepo();
  const p = debug.props;

  function Root() {
    const v = Signal.toObject(p);
    return <DevCrdt.UI debug={v.debug} theme={v.theme} />;
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

    ctx.debug.footer
      .border(0)
      .padding(0)
      .render(() => <RepoFooter repo={repo} />);
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug debug={debug} />);
  });
});
