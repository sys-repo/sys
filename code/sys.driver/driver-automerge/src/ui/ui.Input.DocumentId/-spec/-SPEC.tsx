import { type t, Dev, Signal, Spec } from '../../-test.ui.ts';
import { D } from '../common.ts';
import { DocumentIdInput } from '../mod.ts';
import { Debug, createDebugSignals } from './-SPEC.Debug.tsx';

export default Spec.describe(D.displayName, (e) => {
  const debug = createDebugSignals();
  const p = debug.props;
  const repo = debug.repo;

  function Root() {
    /**
     * NOTE: either pass down the hook (instance) OR the
     *       setup arguments for the hook.
     */
    const args: t.UseDocumentIdHookArgs = { repo };
    const controller = DocumentIdInput.useController(args);

    return (
      <DocumentIdInput.View
        state={controller}
        // state={args} // ← NB: pass instance OR args.
        debug={p.debug.value}
        theme={p.theme.value}
        label={p.label.value}
        placeholder={p.placeholder.value}
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
      .size([480, null])
      .display('grid')
      .render(() => <Root />);
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug debug={debug} />);
  });
});
