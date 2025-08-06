import { Dev, Signal, Spec } from '../../-test.ui.ts';
import { Monaco } from '../../mod.ts';
import { D, STORAGE_KEY } from '../common.ts';
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
          <Monaco.Dev.Editor
            repo={repo}
            localstorage={STORAGE_KEY.DEV}
            editorMargin={v.editorMargin}
            debug={v.debug}
            theme={v.theme}
          />
        );
      });
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug debug={debug} />);
  });
});
