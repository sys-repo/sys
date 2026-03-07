import { Dev, Signal, Spec } from '../../-test.ui.ts';
import { D, css, useEffectController } from '../common.ts';
import { TreeHost } from '../mod.ts';
import { Debug, createDebugSignals } from './-SPEC.Debug.tsx';
import { BackButton } from './-ui.BackButton.tsx';

export default Spec.describe(D.displayName, async (e) => {
  const debug = await createDebugSignals();
  const p = debug.props;

  function Root() {
    const v = Signal.toObject(p);
    const selection = useEffectController(debug.selection) ?? debug.selection.current();
    const tree = selection.tree;
    const selectedPath = selection.selectedPath;
    const styles = {
      base: css({ position: 'relative', display: 'grid' }),
      back: css({ Absolute: [-35, null, null, -35] }),
    };

    return (
      <div className={styles.base.class}>
        <BackButton
          style={styles.back}
          theme={v.theme}
          selectedPath={selectedPath}
          onBack={(e) => debug.selection.intent({ type: 'path.request', path: e.next })}
        />
        <TreeHost.UI
          debug={v.debug}
          theme={v.theme}
          slots={v.slots}
          tree={tree}
          selectedPath={selectedPath}
          onPathRequest={(e) => debug.selection.intent({ type: 'path.request', path: e.path })}
          onNodeSelect={(e) => {
            if (!e.is.leaf) return;
            debug.selection.intent({ type: 'path.request', path: e.path });
          }}
        />
      </div>
    );
  }

  e.it('init', (e) => {
    const ctx = Spec.ctx(e);

    update();
    function update() {
      debug.listen();
      ctx.redraw();
    }

    Signal.effect(update);
    Dev.Theme.signalEffect(ctx, p.theme, 1);

    ctx.subject
      .size('fill', 80)
      .display('grid')
      .render(() => <Root />);
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug debug={debug} />);
  });
});
