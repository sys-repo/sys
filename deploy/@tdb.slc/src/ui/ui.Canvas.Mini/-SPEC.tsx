import { Dev, Spec } from '../-test.ui.ts';
import { Debug, createDebugSignals } from './-SPEC.Debug.tsx';
import { css, Signal } from './common.ts';
import { CanvasMini } from './mod.ts';

export default Spec.describe('Canvas', (e) => {
  const debug = createDebugSignals();
  const p = debug.props;

  e.it('init', (e) => {
    const ctx = Spec.ctx(e);
    Dev.Theme.signalEffect(ctx, debug.props.theme, 1);

    const updateSize = () => {
      const width = p.width.value;
      if (width === undefined) ctx.subject.size('fill-x', 180);
      else ctx.subject.size([width, null]);
    };

    Signal.effect(() => {
      p.width.value;
      p.selected.value;
      p.over.value;
      updateSize();
      ctx.redraw();
    });

    ctx.subject.display('grid').render((e) => {
      return (
        <CanvasMini
          theme={p.theme.value}
          width={p.width.value}
          selected={p.selected.value}
          over={p.over.value}
          onPanelEvent={(e) => {
            if (e.type === 'leave' && p.over.value === e.panel) p.over.value = undefined;
            if (e.type === 'enter') p.over.value = e.panel;
            if (e.type === 'click') p.selected.value = e.panel;
          }}
        />
      );
    });
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug ctx={{ debug }} />);
  });
});
