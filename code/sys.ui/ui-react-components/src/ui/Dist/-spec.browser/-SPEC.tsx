import { Dev, Signal, Spec } from '../../-test.ui.ts';
import { D } from '../common.ts';
import { Dist } from '../mod.ts';
import { Debug, createDebugSignals } from './-SPEC.Debug.tsx';

export default Spec.describe(D.displayName, async (e) => {
  const debug = await createDebugSignals();
  const p = debug.props;

  function Root() {
    const v = Signal.toObject(p);
    const browser = Dist.useBrowserController({
      onSelect: (e) => console.info('⚡️ Browser.onSelect:', e),
      onFilter: (e) => console.info('⚡️ Browser.onFilter:', e),
    });
    return (
      <Dist.UI.Browser
        debug={v.debug}
        theme={v.theme}
        dist={v.dist}
        selectedPath={browser.selectedPath}
        onSelect={browser.onSelect}
        filterText={browser.filterText}
        onFilter={browser.onFilter}
        toolbar={{ placement: 'bottom' }}
      />
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
      .size([360, 300])
      .display('grid')
      .render(() => <Root />);
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug debug={debug} />);
  });
});
