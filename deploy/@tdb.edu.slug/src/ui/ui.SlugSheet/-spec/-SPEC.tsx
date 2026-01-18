import { Dev, Foo, Signal, Spec, SAMPLES } from '../../-test.ui.ts';
import { type t, D } from '../common.ts';
import { SlugSheet } from '../mod.ts';
import { TreeHost } from '../../ui.TreeHost/mod.ts';
import { Debug, createDebugSignals } from './-SPEC.Debug.tsx';

export default Spec.describe(D.displayName, async (e) => {
  const debug = await createDebugSignals();
  const p = debug.props;

  function Root() {
    const v = Signal.toObject(p);

    let main: t.ReactNode | undefined;
    if (v.slots === 'Foo') {
      main = <Foo theme={v.theme} label={'slot:main'} />;
    }
    if (v.slots === 'TreeHost') {
      const treeSlots = {
        main: <Foo theme={v.theme} label={'TreeHost:main'} />,
        aux: <Foo theme={v.theme} label={'TreeHost:aux'} />,
      };
      const root = TreeHost.Data.fromSlugTree(SAMPLES.SlugTree.gHcQi);
      main = <TreeHost.UI root={root} slots={treeSlots} />;
    }
    const slots = main ? ({ main } satisfies t.SlugSheetSlots) : undefined;
    return <SlugSheet.UI debug={v.debug} theme={v.theme} slots={slots} />;
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
