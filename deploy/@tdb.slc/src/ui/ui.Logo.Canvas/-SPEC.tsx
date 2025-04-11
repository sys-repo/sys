import { type t, Dev, Spec } from '../-test.ui.ts';
import { createDebugSignals, Debug } from './-SPEC.Debug.tsx';
import { css, Signal } from './common.ts';
import { LogoCanvas } from './mod.ts';

export default Spec.describe('Logo.Canvas', (e) => {
  const debug = createDebugSignals();
  const p = debug.props;

  const renderCanvas = (options: { theme?: t.CommonTheme } = {}) => {
    return (
      <LogoCanvas
        theme={options.theme ?? p.theme.value}
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
  };

  e.it('init', (e) => {
    const ctx = Spec.ctx(e);

    const updateSize = () => {
      const width = p.width.value;
      if (width === undefined) ctx.subject.size('fill-x', 180);
      else ctx.subject.size([width, null]);
    };

    Dev.Theme.signalEffect(ctx, debug.props.theme, 1);
    Signal.effect(() => {
      debug.listen();
      updateSize();
      ctx.redraw();
    });

    ctx.subject.display('grid').render((e) => renderCanvas());
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug debug={debug} />);
  });

  e.it('ui:footer', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.footer.render((e) => {
      const styles = {
        base: css({ display: 'grid', placeItems: 'center', marginBottom: 55 }),
        body: css({ width: 220 }),
      };
      return (
        <div className={styles.base.class}>
          <div className={styles.body.class}>{renderCanvas({ theme: 'Light' })}</div>
        </div>
      );
    });
  });
});
