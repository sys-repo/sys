import { Dev, Signal, Spec } from '../../-test.ui.ts';
import { Color, css, Crdt, D, STORAGE_KEY } from '../common.ts';
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

    ctx.host.header.padding(0).render(() => {
      const v = Signal.toObject(p);
      const theme = Color.theme(v.theme);
      return (
        <Crdt.UI.Document.Id.View
          theme={v.theme}
          style={{ backgroundColor: Color.alpha(theme.fg, 0.04) }}
          buttonStyle={{ margin: 4 }}
          controller={{ repo, signals: { doc: p.doc }, storageKey: STORAGE_KEY.DEV }}
        />
      );
    });

    ctx.debug.footer
      .border(-0.1)
      .padding(0)
      .render(() => {
        const doc = p.doc.value;
        const theme = Color.theme();
        const styles = {
          base: css({}),
          doc: css({
            borderBottom: `solid 1px ${Color.alpha(theme.fg, 0.1)}`,
            Padding: [10, 15],
          }),
        };

        return (
          <div className={styles.base.class}>
            {doc && (
              <div className={styles.doc.class}>
                <Crdt.UI.Document.Info doc={doc} />
              </div>
            )}
            <Crdt.UI.Repo.SyncSwitch
              repo={debug.repo}
              storageKey={STORAGE_KEY.DEV}
              style={{ margin: 10 }}
            />
          </div>
        );
      });
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug debug={debug} />);
  });
});
