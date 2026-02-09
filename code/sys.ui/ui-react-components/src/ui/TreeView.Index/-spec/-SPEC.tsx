import { Dev, Signal, Spec } from '../../-test.ui.ts';
import { Button } from '../../Button/mod.ts';
import { IndexTreeView } from '../mod.ts';
import { createDebugSignals, Debug } from './-SPEC.Debug.tsx';
import { LeafPanel } from './-ui.LeafPanel.tsx';
import { D, Icons } from './common.ts';

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
        const elSubject = (
          <IndexTreeView.UI
            //
            debug={v.debug}
            theme={v.theme}
            style={{ width }}
            showChevron={v.renderLeaf ? 'always' : v.showChevron}
            indentSize={v.indentSize}
            spinning={v.spinning}
            //
            root={debug.root}
            path={v.path}
            renderLeaf={v.renderLeaf ? (e) => <LeafPanel theme={v.theme} args={e} /> : undefined}
            //
            // onPointer={(e) => console.info(`⚡️ onPointer:`, e)}
            onPressDown={(e) => {
              console.info(`⚡️ onPressDown:`, e);
              if (v.renderLeaf) {
                p.path.value = e.node.path;
                return;
              }
              if (e.hasChildren) p.path.value = e.node.path;
            }}
            onPressUp={(e) => {
              console.info(`⚡️ onPressUp:`, e);
              // if (e.hasChildren) p.path.value = e.node.path;
            }}
            onNodeSelect={(e) => {
              console.info('⚡️ onNodeSelect:', e);
            }}
          />
        );

        const elBackButton = (
          <Button
            enabled={() => (p.path.value?.length ?? 0) > 0}
            disabledOpacity={0.12}
            style={{ Absolute: [-35, null, null, -35] }}
            theme={v.theme}
            onMouseDown={() => (p.path.value = (p.path.value ?? []).slice(0, -1))}
          >
            <Icons.Arrow.Left />
          </Button>
        );

        return (
          <>
            {elBackButton}
            {elSubject}
          </>
        );
      });
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug debug={debug} />);
  });
});
