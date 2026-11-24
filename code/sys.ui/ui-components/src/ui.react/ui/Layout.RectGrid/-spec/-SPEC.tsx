import { Harness, Signal, Spec, type t } from '../../-test.ui.ts';
import { D } from '../common.ts';
import { RectGrid } from '../mod.ts';
import { createDebugSignals, Debug } from './-SPEC.Debug.tsx';
import { Foo } from './-ui.Foo.tsx';

export default Spec.describe(D.displayName, (e) => {
  const debug = createDebugSignals();
  const p = debug.props;

  function Root() {
    const v = Signal.toObject(p);
    const items = Array.from(Array(v.total).keys(), makeItem);

    function makeItem(index: number): t.RectGridItem {
      const selected = v.activeIndex === index;
      const onClick = () => (p.activeIndex.value = index);
      return {
        id: `item-${index}`,
        render: () => <Foo index={index} theme={v.theme} selected={selected} onClick={onClick} />,
      };
    }

    return (
      <RectGrid
        debug={v.debug}
        theme={v.theme}
        activeIndex={v.activeIndex}
        gap={v.gap}
        aspectRatio={v.aspectRatio}
        items={items}
      />
    );
  }

  e.it('init', (e) => {
    const ctx = Spec.ctx(e);
    debug.attach(ctx, {
      subject: { size: 'fill', display: 'grid', render: () => <Root /> },
      effects: [
        () => void Harness.Theme.background(ctx, p.theme.value, 1),
        () => {
          debug.listen();
          ctx.redraw();
        },
      ],
    });
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug debug={debug} />);
  });
});
