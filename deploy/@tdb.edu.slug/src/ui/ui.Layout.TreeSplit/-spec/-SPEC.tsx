import { Dev, Signal, Spec } from '../../-test.ui.ts';
import { D, Icons, css, Button } from '../common.ts';
import { LayoutTreeSplit } from '../mod.ts';
import { Debug, createDebugSignals } from './-SPEC.Debug.tsx';

export default Spec.describe(D.displayName, async (e) => {
  const debug = await createDebugSignals();
  const p = debug.props;

  function Root() {
    const v = Signal.toObject(p);
    const hasPath = (v.path?.length ?? 0) > 0;
    const elBackButton = (
      <Button
        theme={v.theme}
        enabled={hasPath}
        disabledOpacity={0.12}
        style={{ Absolute: [-35, null, null, -35] }}
        onMouseDown={() => (p.path.value = (p.path.value ?? []).slice(0, -1))}
      >
        <Icons.Arrow.Left />
      </Button>
    );

    const styles = { base: css({ position: 'relative', display: 'grid' }) };

    return (
      <div className={styles.base.class}>
        {elBackButton}
        <LayoutTreeSplit.UI
          debug={v.debug}
          theme={v.theme}
          split={v.split}
          root={v.root}
          path={v.path}
          onPathChange={({ path }) => (p.path.value = path)}
          onSplitChange={(e) => (p.split.value = e.split)}
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
