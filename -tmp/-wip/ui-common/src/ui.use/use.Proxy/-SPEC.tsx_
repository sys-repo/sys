import { useProxy } from '.';
import { Color, Dev, ObjectView, Pkg, Time, css, type t } from '../../test.ui';

type TObject = { foo: number; fn?: () => void };
type D = { writeFunction?: boolean };
type T = { object: TObject; debug: D };
const initial: T = { object: { foo: 0 }, debug: {} };

/**
 * Spec
 */
const name = 'useProxy';
export default Dev.describe(name, (e) => {
  type LocalStore = D;
  const localstore = Dev.LocalStorage<LocalStore>(`dev:${Pkg.name}.${name}`);
  const local = localstore.object({ writeFunction: false });

  e.it('ui:init', async (e) => {
    const ctx = Dev.ctx(e);
    const dev = Dev.tools<T>(e, initial);

    const state = await ctx.state<T>(initial);
    await state.change((d) => {
      d.debug.writeFunction = local.writeFunction;
    });

    const theme = Dev.Theme.background(ctx, 'Dark');
    ctx.debug.width(330);
    ctx.subject
      .size([350, null])
      .display('grid')
      .render<T>((e) => {
        const { debug } = e.state;

        const fn = debug.writeFunction ? () => null : undefined;
        const object: TObject = {
          ...e.state.object,
          fn, // NB: writing the function each time causes test-case to ignore functions in comparison.
        };

        return <Sample object={object} theme={theme.name} />;
      });
  });

  e.it('ui:debug', async (e) => {
    const dev = Dev.tools<T>(e, initial);
    const state = await dev.state();

    dev.section('Debug', (dev) => {
      dev.button('redraw', (e) => dev.redraw());
      dev.hr(-1, 5);

      dev.boolean((btn) => {
        const value = (state: T) => !!state.debug.writeFunction;
        btn
          .label((e) => `new function each time`)
          .value((e) => value(e.state))
          .onClick((e) => {
            e.change((d) => (local.writeFunction = Dev.toggle(d.debug, 'writeFunction')));
          });
      });

      dev.hr(5, 20);

      dev.button((btn) => {
        btn
          .label(`object: increment`)
          .right((e) => `foo = ${e.state.object.foo} + 1`)
          .onClick(async (e) => {
            await e.change((d) => d.object.foo++);
            Time.delay(0, () => dev.redraw('subject')); // NB: ensure the react redraws are flushed before re-drawing the dev-harness.
          });
      });
    });
  });

  e.it('ui:footer', async (e) => {
    const dev = Dev.tools<T>(e, initial);
    dev.footer.border(-0.1).render<T>((e) => {
      const data = e.state;
      return <Dev.Object name={name} data={data} expand={1} fontSize={11} />;
    });
  });
});

export type SampleProps = { object: TObject; theme?: t.CommonTheme; style?: t.CssValue };
export const Sample: React.FC<SampleProps> = (props) => {
  const proxy = useProxy(props.object);
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({ color: theme.fg, padding: 8 }),
  };
  return (
    <div {...css(styles.base, props.style)}>
      <ObjectView name={'useProxy'} data={proxy} theme={theme.name} expand={{ level: 4 }} />
    </div>
  );
};
