import { type t, Dev, Signal, Spec } from '../../-test.ui.ts';
import { D } from '../common.ts';
import { RectStack } from '../mod.ts';
import { Debug, createDebugSignals } from './-SPEC.Debug.tsx';
import { Foo } from './-ui.Foo.tsx';

export default Spec.describe(D.displayName, (e) => {
  const debug = createDebugSignals();
  const p = debug.props;

  e.it('init', (e) => {
    const ctx = Spec.ctx(e);
    function update() {
      ctx.redraw();
    }

    Dev.Theme.signalEffect(ctx, p.theme, 1);
    Signal.effect(() => {
      debug.listen();
      update();
    });

    ctx.subject
      .size([450, null])
      .display('grid')
      .render(() => {
        const v = Signal.toObject(p);
        const items: t.RectStackItem[] = Array(v.showTotal)
          .fill(undefined)
          .map((_, i) => {
            return {
              id: `item-${i}`,
              render: () => <Foo index={i} theme={v.theme} />,
            };
          });

        return (
          <RectStack
            debug={v.debug}
            theme={v.theme}
            mode={v.mode}
            activeIndex={v.activeIndex}
            gap={v.gap}
            aspectRatio={v.aspectRatio}
            items={items}
          />
        );
      });

    update();
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug debug={debug} />);
  });
});
