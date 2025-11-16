import { Dev, Signal, Spec } from '../../-test.ui.ts';
import { Crdt, D, STORAGE_KEY } from '../common.ts';
import { MediaComposition } from '../mod.ts';
import { Debug, createDebugSignals } from './-SPEC.Debug.tsx';

export default Spec.describe(D.displayName, async (e) => {
  const debug = await createDebugSignals();
  const repo = debug.repo;
  const p = debug.props;

  console.log('repo', repo);

  e.it('init', (e) => {
    const ctx = Spec.ctx(e);
    function update() {
      ctx.redraw();
    }
    update();

    Dev.Theme.signalEffect(ctx, p.theme, 1);
    Signal.effect(() => {
      debug.listen();
      update();
    });

    ctx.subject
      .size([360, null])
      .display('grid')
      .render(() => {
        const v = Signal.toObject(p);
        return <MediaComposition debug={v.debug} theme={v.theme} />;
      });

    ctx.debug.footer
      .border(-0.1)
      .padding(10)
      .render(() => {
        return <Crdt.UI.Repo.SyncSwitch repo={debug.repo} localstorage={STORAGE_KEY.DEV} />;
      });
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug debug={debug} />);
  });
});
