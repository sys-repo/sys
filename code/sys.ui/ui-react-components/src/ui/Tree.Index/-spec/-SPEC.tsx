import { Dev, Signal, Spec } from '../../-test.ui.ts';
import { D } from '../common.ts';
import { IndexTree } from '../mod.ts';
import { Debug, createDebugSignals } from './-SPEC.Debug.tsx';

export default Spec.describe(D.displayName, (e) => {
  const debug = createDebugSignals();
  const p = debug.props;

  e.it('init', (e) => {
    const ctx = Spec.ctx(e);

    Dev.Theme.signalEffect(ctx, p.theme, 1);
    Signal.effect(() => {
      debug.listen();
      ctx.redraw();
    });

    ctx.subject
      .size('fill-y', 150)
      .display('grid')
      .render(() => {
        const v = Signal.toObject(p);
        const width = 350;
        const root = v.yaml ? IndexTree.Yaml.parse(v.yaml) : undefined;

        return (
          <IndexTree.View
            //
            debug={v.debug}
            theme={v.theme}
            style={{ width }}
            //
            root={root}
            path={v.path}
            // onPointer={(e) => console.info(`⚡️ onPointer:`, e)}
            onPressDown={(e) => console.info(`⚡️ onPressDown:`, e)}
            onPressUp={(e) => {
              console.info(`⚡️ onPressUp:`, e);
              if (e.hasChildren) p.path.value = e.node.path;
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
