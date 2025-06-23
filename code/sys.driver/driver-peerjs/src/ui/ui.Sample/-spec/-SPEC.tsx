import { Dev, Signal, Spec } from '../../-test.ui.ts';
import { type t, Color, Crdt, css, D, STORAGE_KEY } from '../common.ts';
import { Sample } from '../mod.ts';
import { createDebugSignals, Debug } from './-SPEC.Debug.tsx';

export default Spec.describe(D.displayName, (e) => {
  const debug = createDebugSignals();
  const repo = debug.repo;
  const p = debug.props;

  function DocumentId(props: t.DocumentIdProps) {
    const theme = Color.theme(p.theme.value);
    return (
      <Crdt.UI.DocumentId.View
        background={theme.is.dark ? -0.06 : -0.04}
        theme={theme.name}
        buttonStyle={{ margin: 4 }}
        {...props}
        controller={{
          repo,
          signals: { doc: p.doc },
          initial: { count: 0 },
          localstorage: STORAGE_KEY.DEV,
        }}
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
      .size([500, 460])
      .display('grid')
      .render(() => {
        const theme = Color.theme(p.theme.value);
        const styles = {
          base: css({ display: 'grid' }),
          docId: css({ Absolute: [-30, 0, null, 0] }),
          footer: {
            base: css({ Absolute: [null, 0, 0, 0] }),
            body: css({ Absolute: 0, fontSize: 11, padding: 15 }),
            a: css({ color: theme.fg }),
          },
        };

        const link = (label: string, href: string) => {
          const url = new URL(href);
          return (
            <a
              target={'_blank'}
              rel={'noopener noreferrer'}
              href={url.href}
              className={styles.footer.a.class}
            >
              {label}
            </a>
          );
        };

        return (
          <div className={styles.base.class}>
            <DocumentId style={styles.docId} />

            <Sample
              // 🌳
              debug={p.debug.value}
              theme={p.theme.value}
              doc={p.doc.value}
              peerjs={debug.peer}
            />

            <div className={styles.footer.base.class}>
              <div className={styles.footer.body.class}>
                {link(
                  'ref: sys.ui.media.video - MediaStream',
                  'https://fs.db.team/sys/ui/?dev=6662459692802',
                )}
              </div>
            </div>
          </div>
        );
      });

    ctx.debug.footer
      .border(-0.1)
      .padding(10)
      .render(() => {
        return <Crdt.UI.Repo.SyncEnabledSwitch repo={repo} localstorage={STORAGE_KEY.DEV} />;
      });
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug debug={debug} />);
  });
});
