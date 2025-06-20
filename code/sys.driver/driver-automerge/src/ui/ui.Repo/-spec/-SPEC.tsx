import { Dev, Signal, Spec } from '../../-test.ui.ts';
import { type t, D, Crdt } from '../common.ts';
import { Repo } from '../mod.ts';
import { Debug, createDebugSignals } from './-SPEC.Debug.tsx';

export default Spec.describe(D.displayName, (e) => {
  const debug = createDebugSignals();
  const p = debug.props;

  function Root() {
    /**
     * NOTE: either pass down the hook (instance)
     *       OR the setup arguments for the hook.
     */
    const ws = 'sync.db.team';
    const args: t.UseRepoHookArgs = {
      signals: { repo: p.repo },
      factory(e) {
        return Crdt.repo({
          storage: { database: 'dev.crdt' },
          network: e.syncEnabled ? { ws } : undefined,
        });
      },
    };
    const hook = Repo.useRepo(args);
    const props = hook.signals.toValues();

    return (
      <Repo.SyncEnabledSwitch
        theme={p.theme.value}
        debug={p.debug.value}
        //
        endpoint={ws}
        enabled={props.syncEnabled}
        peerId={props.repo?.id?.peer}
        //
        onChange={hook.handlers.onSyncEnabledChange}
      />
    );
  }

  e.it('init', (e) => {
    const ctx = Spec.ctx(e);

    Dev.Theme.signalEffect(ctx, p.theme, 1);
    Signal.effect(() => {
      debug.listen();
      ctx.redraw();
    });

    ctx.subject
      .size([380, null])
      .display('grid')
      .render(() => <Root />);
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug debug={debug} />);
  });
});
