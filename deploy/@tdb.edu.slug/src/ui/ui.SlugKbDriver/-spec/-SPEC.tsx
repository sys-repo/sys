import { Dev, Signal, Spec } from '../../-test.ui.ts';
import { BackButton } from '../../ui.TreeHost/-spec/mod.ts';
import { createDebugSignals, Debug } from './-SPEC.Debug.tsx';
import { css, D, FileContentTreePanel, SampleFileContent } from './common.ts';
import { TreeHost } from './mod.ts';

export default Spec.describe(D.displayName, async (e) => {
  const debug = await createDebugSignals();
  const p = debug.props;

  function Root() {
    const v = Signal.toObject(p);
    const data = v.contentData;
    const loading = v.spinning && v.probe.active === 'tree-content';
    const showFileTreePanel = !!data || loading;
    const styles = {
      base: css({ position: 'relative', display: 'grid' }),
      back: css({ Absolute: [-35, null, null, -35] }),
    };

    /** Slot content. */
    const tree = showFileTreePanel && (
      <FileContentTreePanel data={data} loading={loading} theme={v.theme} debug={v.debug} />
    );
    const main = (data || loading) && (
      <SampleFileContent data={data} loading={loading} theme={v.theme} debug={v.debug} />
    );

    return (
      <div className={styles.base.class}>
        <BackButton
          style={styles.back}
          theme={v.theme}
          selectedPath={v.selectedPath}
          onBack={(e) => (p.selectedPath.value = e.next)}
        />
        <TreeHost.UI
          debug={v.debug}
          theme={v.theme}
          tree={v.tree}
          selectedPath={v.selectedPath}
          slots={{ tree, main }}
          onPathRequest={(e) => (p.selectedPath.value = e.path)}
          onNodeSelect={() => undefined}
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
