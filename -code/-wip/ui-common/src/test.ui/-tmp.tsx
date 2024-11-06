import { css, Dev, pkg, type t } from './mod.ts';

type P = {};
type T = { props: P };
const initial: T = { props: {} };

/**
 * Spec
 */
const name = 'TMP';

export default Dev.describe(name, (e) => {
  e.it('ui:init', (e) => {
    const ctx = Dev.ctx(e);
    const dev = Dev.tools<T>(e, initial);

    ctx.debug.width(330);
    ctx.subject
      .size([250, null])
      .display('grid')
      .render<T>((e) => {
        const { props } = e.state;
        Dev.Theme.background(ctx, 'Dark', 1);

        const styles = {
          base: css({
            backgroundColor: 'rgba(255, 0, 0, 0.1)' /* RED */,
            // padding: 10,
          }),
          child: css({
            backgroundColor: 'rgba(255, 0, 0, 0.2)' /* RED */,
            // padding: 5,
            MarginX: 5,
            // MarginX,
          }),
        };

        return (
          <div {...styles.base}>
            <div {...styles.child}>{`🐷 ${name}`}</div>
          </div>
        );
      });
  });

  e.it('ui:debug', async (e) => {
    const dev = Dev.tools<T>(e, initial);
    const state = await dev.state();
    const link = Dev.Link.pkg(pkg, dev);
    dev.TODO();

    dev.hr(5, 20);

    dev.section('Debug', (dev) => {
      dev.button('redraw', (e) => dev.redraw());
    });
  });

  e.it('ui:footer', (e) => {
    const dev = Dev.tools<T>(e, initial);
    dev.footer.border(-0.1).render<T>((e) => {
      const data = e.state;
      return <Dev.Object name={name} data={data} expand={1} fontSize={11} />;
    });
  });
});
