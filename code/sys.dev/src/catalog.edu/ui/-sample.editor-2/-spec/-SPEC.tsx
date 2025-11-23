import { Dev, Signal, Spec } from '../../-test.ui.ts';
import { Color, Crdt, D, STORAGE_KEY, css } from '../common.ts';
import { Sample } from '../mod.ts';
import { Debug, createDebugSignals } from './-SPEC.Debug.tsx';

export default Spec.describe(D.displayName, (e) => {
  const debug = createDebugSignals();
  const repo = debug.repo;
  const p = debug.props;

  function DebugFooter() {
    const theme = Color.theme();
    const border = `solid 1px ${Color.alpha(theme.fg, 0.1)}`;
    const styles = {
      base: css({ position: 'relative', boxSizing: 'border-box' }),
      info: css({ Padding: [15, 45], borderTop: border, borderBottom: border }),
      switch: css({ Padding: [14, 10] }),
    };
    return (
      <div className={styles.base.class}>
        <div className={styles.info.class}>
          <Crdt.UI.Repo.Info repo={repo} theme={theme.name} />
        </div>
        <div className={styles.switch.class}>
          <Crdt.UI.Repo.SyncSwitch repo={repo} storageKey={STORAGE_KEY.DEV} theme={theme.name} />
        </div>
      </div>
    );
  }

  e.it('init', (e) => {
    const ctx = Spec.ctx(e);
    function update() {
      ctx.debug.width(debug.url.debug !== false ? 400 : 0);
      ctx.redraw();
    }

    update(); // initial
    Dev.Theme.signalEffect(ctx, p.theme, 1);
    Signal.effect(() => {
      debug.listen();
      update();
    });

    ctx.subject
      .size('fill')
      .display('grid')
      .render(() => {
        const v = Signal.toObject(p);
        return (
          <Sample
            repo={repo}
            bus={debug.bus}
            signals={debug.signals}
            debug={v.debug}
            theme={v.theme}
            wordWrap={v.wordWrap}
          />
        );
      });

    ctx.debug.footer
      .border(0)
      .padding(0)
      .render(() => <DebugFooter />);
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug debug={debug} />);
  });
});
