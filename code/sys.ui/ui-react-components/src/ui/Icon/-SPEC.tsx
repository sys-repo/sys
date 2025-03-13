import { css, Spec, type t } from '../-test.ui.ts';
import { Debug } from './-SPEC.Debug.tsx';
import { Icons } from './-SPEC.icons.ts';

type T = {
  props: t.IconProps;
  debug: { inheritColor: boolean };
};
// const initial: T = {
//   props: { tooltip: 'Hello' },
//   debug: { inheritColor: true },
// };

export default Spec.describe('Icon', (e) => {
  e.it('init', async (e) => {
    const ctx = Spec.ctx(e);
    // await ctx.state<T>(initial);

    ctx.subject
      .backgroundColor(1)
      .display('grid')
      .render<T>((e) => {
        // const debug = e.state.debug;
        const styles = {
          base: css({
            // color: debug.inheritColor ? COLORS.MAGENTA : undefined, // NB: button should inherit this color.
          }),
        };
        return (
          <div className={styles.base.class}>
            <Icons.Face {...e.state.props} size={150} />
          </div>
        );
      });
  });

  e.it('ui:debug', async (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug ctx={{}} />);

    // const dev = Dev.tools<T>(e, initial);
    //     dev.section('Properties', (dev) => {
    //       dev.boolean((btn) => {
    //         const value = (state: T) => Boolean(state.props.flipX);
    //         btn
    //           .label((e) => `flipX`)
    //           .value((e) => value(e.state))
    //           .onClick((e) => e.change((d) => Dev.toggle(d.props, 'flipX')));
    //       });
    //
    //       dev.boolean((btn) => {
    //         const value = (state: T) => Boolean(state.props.flipY);
    //         btn
    //           .label((e) => `flipY`)
    //           .value((e) => value(e.state))
    //           .onClick((e) => e.change((d) => Dev.toggle(d.props, 'flipY')));
    //       });
    //
    //       dev.boolean((btn) =>
    //         btn
    //           .label((e) => {
    //             const offset = e.state.props.offset;
    //             return `offset: ${offset ? `[${offset.toString()}]` : '<none>'}`;
    //           })
    //           .value((e) => Boolean(e.state.props.offset))
    //           .onClick((e) => {
    //             e.change((d) => {
    //               const exists = Boolean(d.props.offset);
    //               d.props.offset = exists ? undefined : [35, -40];
    //             });
    //           }),
    //       );
    //     });
    //
    //     dev.hr(5, 20);
    //
    //     dev.section('Debug', (dev) => {
    //       dev.boolean((btn) =>
    //         btn
    //           .label((e) => `inherit color: ${e.state.debug.inheritColor ? 'magenta' : '(none)'}`)
    //           .value((e) => e.state.debug.inheritColor)
    //           .onClick((e) => e.change((d) => Dev.toggle(d.debug, 'inheritColor'))),
    //       );
    //     });
    //
    //     dev.hr(5, 20);
    //
    //     dev.section('Debug', (dev) => {
    //       const color = (name: string, value?: string) => {
    //         dev.button(name, (e) => e.change((d) => (d.props.color = value)));
    //       };
    //       color('black (dark)', COLORS.DARK);
    //       color('cyan', COLORS.CYAN);
    //       color('blue', COLORS.BLUE);
    //       color('red', COLORS.RED);
    //       dev.hr(-1, 5);
    //       color('<undefined> - inherit');
    //     });
    //
    //     dev.hr();
    //
    //     dev.section('Tooltip', (dev) => {
    //       dev.button('"Hello"', (e) => e.change((d) => (d.props.tooltip = 'Hello')));
    //       dev.button('none', (e) => e.change((d) => (d.props.tooltip = undefined)));
    //     });
  });

  e.it('ui:footer', async (e) => {
    // const dev = Dev.tools<T>(e, initial);
    // dev.footer
    //   .border(-0.1)
    //   .render<T>((e) => <Dev.Object name={'spec'} data={e.state} expand={1} />);
  });
});
