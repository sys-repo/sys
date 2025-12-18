import { Dev, Signal, Spec } from '../../-test.ui.ts';
import { D } from '../common.ts';
import { Dist } from '../mod.ts';
import { Debug, createDebugSignals } from './-SPEC.Debug.tsx';

export default Spec.describe(D.displayName, async (e) => {
  const debug = await createDebugSignals();
  const p = debug.props;

  function Root() {
    const v = Signal.toObject(p);
    return <Dist.UI debug={v.debug} theme={v.theme} dist={v.dist} />;
  }

  function Browser() {
    const v = Signal.toObject(p);

    const browser = Dist.useBrowserController({
      onSelect: (e) => console.info('⚡️ Dist.Browser.onSelect:', e),
    });

    return (
      <Dist.UI.Browser
        debug={v.debug}
        theme={v.theme}
        dist={v.dist}
        selectedPath={browser.selectedPath}
        onSelect={browser.onSelect}
        toolbar={{
          placement: 'bottom',
          onFilter: (e) => console.info(`⚡️ Dist.Browser.Toolbar.onFilter`, e),
        }}
      />
    );
  }

  e.it('init', (e) => {
    const ctx = Spec.ctx(e);

    update();
    function update() {
      const view = p.debugView.value;
      if (view === 'UI.Browser') {
        ctx.subject.size([360, 300]);
      } else {
        ctx.subject.size([360, null]);
      }

      debug.listen();
      ctx.redraw();
    }

    Signal.effect(update);
    Dev.Theme.signalEffect(ctx, p.theme, 1);

    ctx.subject.display('grid').render(() => {
      const v = Signal.toObject(p);

      if (v.debugView === 'UI') return <Root />;
      if (v.debugView === 'UI.Browser') return <Browser />;
      // return <Dist.UI debug={v.debug} theme={v.theme} dist={v.dist} />;

      return null;
    });
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug debug={debug} />);
  });
});
