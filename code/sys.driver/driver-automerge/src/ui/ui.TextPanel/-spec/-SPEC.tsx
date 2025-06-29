import { Dev, Signal, Spec } from '../../-test.ui.ts';
import { DocumentId } from '../../mod.ts';

import { D } from '../common.ts';
import { TextPanel } from '../mod.ts';
import { Debug, createDebugSignals, STORAGE_KEY } from './-SPEC.Debug.tsx';

export default Spec.describe(D.displayName, (e) => {
  const debug = createDebugSignals();
  const repo = debug.repo;
  const p = debug.props;

  function DebugDocumentId() {
    const doc = p.doc;
    return (
      <DocumentId.View
        buttonStyle={{ margin: 4 }}
        controller={{
          repo,
          signals: { doc },
          initial: { text: '' },
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
      .size([350, 200])
      .display('grid')
      .render(() => {
        const v = Signal.toObject(p);
        const { padding } = v;
        return (
          <TextPanel
            label={v.label}
            doc={v.doc}
            path={v.path}
            //
            debug={v.debug}
            theme={v.theme}
            style={{ padding }}
          />
        );
      });

    ctx.debug.header
      .padding(0)
      .border(-0.1)
      .render(() => <DebugDocumentId />);
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug debug={debug} />);
  });
});
