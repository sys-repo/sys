import { Dev, css, useMouse, type t } from '../../test.ui';

type T = {
  debug: { dragEnabled: boolean; cancelOnFirstMove: boolean };
};
const initial: T = {
  debug: { dragEnabled: true, cancelOnFirstMove: false },
};

const name = 'useMouse';
export default Dev.describe(name, (e) => {
  e.it('ui:init', async (e) => {
    const ctx = Dev.ctx(e);
    const dev = Dev.tools<T>(e, initial);

    const state = await ctx.state<T>(initial);
    await state.change((d) => {});

    ctx.debug.width(330);
    ctx.subject
      .backgroundColor(1)
      .size([250, null])
      .display('grid')
      .render<T>((e) => {
        return <Sample {...e.state.debug} />;
      });
  });

  e.it('ui:debug', async (e) => {
    const dev = Dev.tools<T>(e, initial);
    const state = await dev.state();

    dev.section('Debug', (dev) => {
      dev.boolean((btn) => {
        const value = (state: T) => Boolean(state.debug.dragEnabled);
        btn
          .label((e) => `drag enabled`)
          .value((e) => value(e.state))
          .onClick((e) => e.change((d) => Dev.toggle(d.debug, 'dragEnabled')));
      });

      dev.boolean((btn) => {
        const value = (state: T) => Boolean(state.debug.cancelOnFirstMove);
        btn
          .label((e) => `cancel on move (first event)`)
          .value((e) => value(e.state))
          .onClick((e) => e.change((d) => Dev.toggle(d.debug, 'cancelOnFirstMove')));
      });
    });

    dev.hr(5, 20);
  });

  e.it('ui:footer', async (e) => {
    const dev = Dev.tools<T>(e, initial);
    const state = await dev.state();
    dev.footer.border(-0.1).render<T>((e) => {
      const data = e.state;
      return <Dev.Object name={name} data={data} expand={1} />;
    });
  });
});

/**
 * Component
 */
function Sample(props: T['debug']) {
  const handleDrag: t.UseMouseDragHandler = (e) => {
    console.info('⚡️ onDrag', e);
    if (props.cancelOnFirstMove) e.cancel();
  };

  // NB: when onDrag is undefined, the drag behavior is not enabled (no performance hit).
  const onDrag = props.dragEnabled ? handleDrag : undefined;
  const mouse = useMouse({ onDrag });

  const styles = {
    base: css({
      position: 'relative',
      Padding: [8, 10],
      userSelect: 'none',
    }),
  };

  const data = {
    is: mouse.is,
    drag: mouse.drag,
  };

  return (
    <div {...styles.base} {...mouse.handlers}>
      <Dev.Object name={'useMouse'} data={data} expand={2} />
    </div>
  );
}
