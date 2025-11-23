import { Dev, Signal, Spec } from '../../-test.ui.ts';
import { Monaco } from '../../mod.ts';
import { Color, Crdt, D, STORAGE_KEY, css } from '../common.ts';
import { Debug, createDebugSignals } from './-SPEC.Debug.tsx';

export default Spec.describe(D.displayName, (e) => {
  const debug = createDebugSignals();
  const repo = debug.repo;
  const p = debug.props;

  e.it('init', (e) => {
    const ctx = Spec.ctx(e);

    Dev.Theme.signalEffect(ctx, p.theme, 1);
    Signal.effect(() => {
      debug.listen();
      ctx.redraw();
    });

    ctx.subject
      .size('fill', 100)
      .display('grid')
      .render(() => {
        const v = Signal.toObject(p);
        if (!v.render) return null;
        return (
          <Monaco.Yaml.Editor
            bus$={debug.bus$}
            signals={debug.signals}
            repo={repo}
            documentId={v.documentId}
            editor={v.editor}
            footer={v.footer}
            path={v.path}
            diagnostics={v.diagnostics}
            debug={v.debug}
            theme={v.theme}
            onReady={(e) => {
              console.info(`⚡️ MonacoEditor.onReady:`, e);
              e.$.subscribe((e) => console.info(`⚡️ Monaco.Yaml.Editor/binding.$:`, e));

              /**
               * Sample: Link registration(s):
               */
              Monaco.Crdt.Link.enable(e, repo, {
                onCreate: (ev) => console.info('Monaco.Crdt.Link.enable → ⚡️ onCreate:', ev),
                until: e.dispose$,
              });
            }}
            onDocumentLoaded={(e) => console.info(`⚡️ Monaco.Yaml.Editor.onDocumentLoaded:`, e)}
            onCursor={(e) => console.info(`⚡️ Monaco.Yaml.Editor.onCursor:`, e)}
          />
        );
      });

    ctx.debug.footer
      .border(0)
      .padding(0)
      .render(() => {
        const theme = Color.theme();
        const styles = {
          base: css({ position: 'relative', boxSizing: 'border-box' }),
          info: css({ Padding: [10, 15] }),
          switch: css({ borderTop: `solid 1px ${Color.alpha(theme.fg, 0.1)}`, Padding: [14, 10] }),
        };
        return (
          <div className={styles.base.class}>
            <div className={styles.info.class}>
              <Crdt.UI.Repo.Info repo={repo} style={styles.info} theme={theme.name} />
            </div>
            <div className={styles.switch.class}>
              <Crdt.UI.Repo.SyncSwitch
                repo={repo}
                storageKey={STORAGE_KEY.DEV}
                theme={theme.name}
              />
            </div>
          </div>
        );
      });
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug debug={debug} />);
  });
});
