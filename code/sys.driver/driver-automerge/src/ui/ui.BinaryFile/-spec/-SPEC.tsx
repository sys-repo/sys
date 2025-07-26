import { Dev, Signal, Spec } from '../../-test.ui.ts';
import { DocumentId } from '../../ui.DocumentId/mod.ts';
import { type t, Color, D } from '../common.ts';
import { BinaryFile } from '../mod.ts';
import { createDebugSignals, Debug, STORAGE_KEY } from './-SPEC.Debug.tsx';

export default Spec.describe(D.displayName, (e) => {
  const debug = createDebugSignals();
  const repo = debug.repo;
  const p = debug.props;

  function HostDocumentId(props: t.DocumentIdProps) {
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
          localstorage: STORAGE_KEY.DEV,
        }}
        {...props}
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
      .size([450, 450])
      .display('grid')
      .render(() => {
        const v = Signal.toObject(p);
        return (
          <BinaryFile
            //
            debug={v.debug}
            theme={v.theme}
            doc={v.doc}
            path={v.path}
          />
        );
      });

    ctx.host.header.padding(0).render(() => <HostDocumentId />);
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug debug={debug} />);
  });
});
