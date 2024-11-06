import { Dev, type t, css } from '../../test.ui';
import { useSizeObserver } from '.';
import { type } from 'os';

type T = {
  args?: t.UseSizeObserverChangeHandlerArgs;
};
const initial: T = {};
const name = 'useSizeObserver';

export default Dev.describe(name, (e) => {
  e.it('ui:init', async (e) => {
    const ctx = Dev.ctx(e);
    const dev = Dev.tools<T>(e, initial);

    const state = await ctx.state<T>(initial);
    await state.change((d) => {});

    ctx.debug.width(330);
    ctx.subject
      .size('fill', 150)
      .display('flex')
      .backgroundColor(1)
      .render(() => <Sample onSize={(e) => state.change((d) => (d.args = e))} />);
  });

  e.it('ui:debug', async (e) => {
    const dev = Dev.tools<T>(e, initial);
    const state = await dev.state();
  });

  e.it('ui:footer', async (e) => {
    const dev = Dev.tools<T>(e, initial);
    const state = await dev.state();
    dev.footer.border(-0.1).render<T>((e) => {
      const data = e.state.args;
      return <Dev.Object name={name} data={data} expand={{ level: 1, paths: ['$', '$.size'] }} />;
    });
  });
});

/**
 * Component
 */
type SampleProps = {
  onSize?: t.UseSizeObserverChangeHandler;
};
const Sample = (props: SampleProps) => {
  const resize = useSizeObserver({
    onChange(e) {
      console.info('⚡️ onChange', e);
      props.onSize?.(e);
    },
  });

  const styles = {
    base: css({ flex: 1 }),
    body: css({
      Absolute: 0,
      paddingTop: 10,
      paddingLeft: 15,
      fontWeight: 'bold',
      overflow: 'hidden',
    }),
  };

  const { resizing, batch, rect } = resize;
  const data = {
    resizing,
    batch,
    rect,
  };

  return (
    <div {...styles.base} ref={resize.ref}>
      <div {...styles.body}>
        <Dev.Object data={data} expand={1} fontSize={18} />
      </div>
    </div>
  );
};
