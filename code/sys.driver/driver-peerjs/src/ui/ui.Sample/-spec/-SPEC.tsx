import { Dev, Signal, Spec } from '../../-test.ui.ts';
import { type t, Color, Crdt, css, D, P, STORAGE_KEY, Url } from '../common.ts';

import { Sample } from '../mod.ts';
import { FullScreen } from '../ui.FullScreen.tsx';
import { createDebugSignals, Debug } from './-SPEC.Debug.tsx';
import { HostFooter } from './-ui.ts';

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
          urlKey: 'room',
          url: (e) => {
            const url = Url.parse(location.href).toURL();
            url.searchParams.set(e.urlKey, e.docId);
            return url.href;
          },
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

    const width = 550;
    ctx.subject
      .size([width, 460])
      .display('grid')
      .render(() => {
        const v = Signal.toObject(p);
        const isFullscreen = !!v.selectedStream;
        const styles = {
          base: css({ display: 'grid' }),
          docId: css({ Absolute: [-30, 0, null, 0] }),
          sample: css({
            opacity: isFullscreen ? 0 : 1,
            pointerEvents: isFullscreen ? 'none' : 'auto',
          }),
        };

        return (
          <div className={styles.base.class}>
            {/* <LocalDocumentId style={styles.docId} autoFocus={true} /> */}

            <Sample
              // 🌳
              style={styles.sample}
              debug={P.DEV.mode.get(v.doc?.current)}
              theme={v.theme}
              //
              repo={repo}
              doc={v.doc}
              peer={debug.peer}
              remoteStream={v.remoteStream}
              //
              onReady={(e) => {
                console.info(`⚡️ Sample.onReady:`, e);
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

    ctx.host.footer.padding(0).render(() => {
      const v = Signal.toObject(p);
      const debug = P.DEV.mode.get(v.doc?.current, false);
      return <HostFooter theme={v.theme} debug={debug} doc={v.doc} />;
    });

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

    ctx.debug.header
      .border(0.1)
      .padding(0)
      .render((e) => {
        return <LocalDocumentId theme={'Light'} />;
      });

    // Finish up.
    updateSize();
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug debug={debug} />);
  });
});
