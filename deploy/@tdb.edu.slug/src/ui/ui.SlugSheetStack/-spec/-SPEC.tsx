import { Dev, Signal, Spec } from '../../-test.ui.ts';
import { SlugSheet } from '../../ui.SlugSheet/mod.ts';
import { SAMPLES, TreeHost } from '../../ui.TreeHost/-spec/mod.ts';

import { css, D } from '../common.ts';
import { SlugSheetStack } from '../mod.ts';
import { createDebugSignals, Debug } from './-SPEC.Debug.tsx';

const treeRoot = TreeHost.Data.fromSlugTree(SAMPLES.SlugTree.gHcQi);
const rootSheet = SlugSheet.Controller.create({ root: treeRoot });
const stackController = SlugSheetStack.Controller.create();
stackController.push({ id: 'root', sheet: rootSheet });

let overlayId = 0;
const pushOverlay = () => {
  const sheet = SlugSheet.Controller.create({ root: treeRoot });
  stackController.push({ id: `overlay-${overlayId++}`, sheet });
};

const styles = {
  base: css({ display: 'grid', position: 'relative', minHeight: 520 }),
};

export default Spec.describe(D.displayName, async (e) => {
  const debug = await createDebugSignals();
  const p = debug.props;

  function Root() {
    const v = Signal.toObject(debug.props);
    const stackProps = stackController.props();
    return (
      <div className={styles.base.class}>
        <SlugSheetStack.UI {...stackProps} debug={v.debug} theme={v.theme} />
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
    ctx.debug.row(<Debug debug={debug} onPushOverlay={pushOverlay} />);
  });
});
