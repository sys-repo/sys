import { Dev, Signal, Spec } from '../../-test.ui.ts';
import { Crdt, D, STORAGE_KEY } from '../common.ts';
import { EditorCanvas } from '../mod.ts';
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
        return (
          <EditorCanvas
            theme={v.theme}
            doc={v.doc}
            panels={v.panels}
            debug={v.debug}
            debugSize={{ style: { Absolute: [-30, 3, null, null] } }}
          />
        );
      });

    ctx.debug.header
      .padding(0)
      .border(-0.1)
      .render(() => {
        return (
          <Crdt.UI.DocumentId.View
            theme={'Light'}
            buttonStyle={{ margin: 4 }}
            controller={{
              repo,
              signals: { doc: p.doc },
              initial: { text: '' },
              localstorage: STORAGE_KEY.DEV,
            }}
          />
        );
      });
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug debug={debug} />);
  });
});
