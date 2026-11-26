import { Harness, Signal, Spec } from '../../-test.ui.ts';
import { DocumentId } from '../../ui.DocumentId/mod.ts';
import { type t, Color, D } from '../common.ts';
import { Binary } from '../mod.ts';
import { createDebugSignals, Debug, STORAGE_KEY } from './-SPEC.Debug.tsx';

export default Spec.describe(D.displayName, (e) => {
  const debug = createDebugSignals();
  const repo = debug.repo;
  const p = debug.props;

  function HostDocumentId(props: t.Crdt.DocumentId.Props) {
    const doc = p.doc;
    const theme = Color.theme(p.theme.value);
    return (
      <DocumentId.View
        background={theme.is.dark ? -0.06 : -0.04}
        theme={theme.name}
        buttonStyle={{ margin: 4 }}
        controller={{
          repo,
          signals: { doc },
          initial: { text: '' },
          storageKey: STORAGE_KEY.DEV,
        }}
        {...props}
      />
    );
  }

  function Root() {
    const v = Signal.toObject(p);
    return <Binary.View debug={v.debug} theme={v.theme} doc={v.doc} path={v.path} />;
  }

  e.it('init', (e) => {
    const ctx = Spec.ctx(e);
    debug.attach(ctx, {
      subject: { size: [450, 450], display: 'grid', render: () => <Root /> },
      effects: [
        () => void Harness.Theme.background(ctx, p.theme.value, 1),
        () => {
          debug.listen();
          ctx.redraw();
        },
      ],
    });

    ctx.host.header.padding(0).render(() => <HostDocumentId />);
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug debug={debug} />);
  });
});
