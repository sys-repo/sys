import { Dev, Signal, Spec } from '../../-test.ui.ts';
import { type t, Color, Crdt, css, D, STORAGE_KEY } from '../common.ts';

import { Sample } from '../mod.ts';
import { FullScreen } from '../ui.FullScreen.tsx';
import { createDebugSignals, Debug } from './-SPEC.Debug.tsx';
import { HostFooter } from './-ui.Footer.tsx';

export default Spec.describe(D.displayName, (e) => {
  const debug = createDebugSignals();
  const repo = debug.repo;
  const p = debug.props;

  function LocalDocumentId(props: t.DocumentIdProps) {
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

    const updateSize = () => {
      const stream = p.selectedStream.value;
      ctx.debug.width(!!stream ? 0 : 400);
    };

    Dev.Theme.signalEffect(ctx, p.theme, 1);
    Signal.effect(() => {
      debug.listen();
      updateSize();
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
        };

        return (
          <div className={styles.base.class}>
            <LocalDocumentId style={styles.docId} autoFocus={true} />

            <Sample
              // 🌳
              debug={p.debug.value}
              theme={p.theme.value}
              //
              peer={debug.peer}
              doc={p.doc.value}
              remoteStream={p.remoteStream.value}
              //
              onReady={(e) => {
                console.info(`⚡️ onReady:`, e);
                p.localStream.value = e.self.stream;
              }}
              onSelect={(e) => {
                console.info(`⚡️ onSelect:`, e);
                p.selectedStream.value = e.stream;
              }}
            />
          </div>
        );
      });

    ctx.debug.footer
      .border(-0.1)
      .padding(0)
      .render(() => {
        return (
          <Crdt.UI.Repo.SyncEnabledSwitch
            repo={repo}
            localstorage={STORAGE_KEY.DEV}
            style={{ Padding: [14, 10] }}
          />
        );
      });

    ctx.host.footer
      .padding(0)
      .render(() => <HostFooter theme={p.theme.value} debug={p.debug.value} doc={p.doc.value} />);

    ctx.host.layer(1).render(() => {
      const stream = p.selectedStream.value;
      if (!stream) return null;
      return (
        <FullScreen
          stream={stream}
          theme={p.theme.value}
          onClose={() => (p.selectedStream.value = undefined)}
        />
      );
    });

    // Finish up.
    updateSize();
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug debug={debug} />);
  });
});
