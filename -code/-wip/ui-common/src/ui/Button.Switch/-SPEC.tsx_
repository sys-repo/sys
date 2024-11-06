import { Switch } from '.';
import { Dev, Pkg, type t } from '../../test.ui';

type P = t.SwitchProps;
type T = { props: P };
const initial: T = { props: { value: true } };

const name = Switch.displayName ?? 'Unknown';
export default Dev.describe(name, (e) => {
  type LocalStore = Pick<P, 'theme'>;
  const localstore = Dev.LocalStorage<LocalStore>(`dev:${Pkg.name}.${name}`);
  const local = localstore.object({ theme: undefined });

  e.it('init', async (e) => {
    const ctx = Dev.ctx(e);
    const state = await ctx.state<T>(initial);

    state.change((d) => {
      d.props.theme = local.theme;
    });

    ctx.debug.width(330);
    ctx.subject.render<T>((e) => {
      const { props } = e.state;
      Dev.Theme.background(ctx, props.theme as t.CommonTheme, 1);

      return (
        <Switch
          {...e.state.props}
          onClick={(e) => state.change(({ props }) => (props.value = !props.value))}
        />
      );
    });
  });

  e.it('ui:debug', async (e) => {
    const dev = Dev.tools<T>(e, initial);

    dev.button('toggle: enabled', (e) => e.change((d) => Dev.toggle(d.props, 'enabled')));
    dev.button('toggle: value', (e) => e.change((d) => Dev.toggle(d.props, 'value')));
    dev.hr(-1, 5);
    Dev.Theme.switch(dev, ['props', 'theme'], (next) => (local.theme = next));
  });

  e.it('ui:footer', async (e) => {
    const dev = Dev.tools<T>(e, initial);
    dev.footer.border(-0.1).render<T>((e) => {
      const data = e.state;
      return <Dev.Object name={name} data={data} expand={1} fontSize={11} />;
    });
  });
});
