import { Dev, Signal, Spec } from '../../-test.ui.ts';
import { D, Input } from '../common.ts';
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
      .size('fill')
      .display('grid')
      .render(() => <EditorCanvas debug={p.debug.value} theme={p.theme.value} />);

    ctx.debug.header
      .padding(0)
      .border(-0.1)
      .render(() => {
        return (
          <Input.DocumentId.View
            theme={'Light'}
            buttonStyle={{ margin: 4 }}
            controller={{
              repo,
              signals: { doc: p.doc },
              initial: { text: '' },
              localstorageKey: `dev:${D.name}.crdt`,
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
