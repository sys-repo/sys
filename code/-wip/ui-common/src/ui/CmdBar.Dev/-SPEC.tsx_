import { Dev as Root } from '.';
import { Dev, Immutable, Pkg, rx } from '../../test.ui';
import { type t, DEFAULTS } from './common';

type T = {
  theme?: t.CommonTheme;
  debug: {};
};
const initial: T = { debug: {} };

/**
 * Spec
 */
const name = DEFAULTS.displayName;
export default Dev.describe(name, (e) => {
  type LocalStore = T['debug'] & Pick<t.MainArgsCardProps, 'theme'>;
  const localstore = Dev.LocalStorage<LocalStore>(`dev:${Pkg.name}.${name}`);
  const local = localstore.object({
    theme: 'Dark',
  });

  const main = Immutable.clonerRef<t.MainProps>({});

  e.it('ui:init', async (e) => {
    const ctx = Dev.ctx(e);
    const dev = Dev.tools<T>(e, initial);

    const state = await ctx.state<T>(initial);
    await state.change((d) => {
      d.theme = local.theme;
    });

    main.change((d) => {});

    main
      .events()
      .changed$.pipe(rx.debounceTime(50))
      .subscribe(() => dev.redraw());

    ctx.debug.width(330);
    ctx.subject
      .size('fill')
      .display('grid')
      .render<T>((e) => {
        const { debug, theme } = e.state;
        const props = main.current;
        Dev.Theme.background(dev, theme, 1);
        return <Root.Main {...props} theme={theme} />;
      });
  });

  e.it('ui:debug', async (e) => {
    const dev = Dev.tools<T>(e, initial);
    const state = await dev.state();
    const link = Dev.Link.pkg(Pkg, dev);

    link.button('see usage: CmdBar.Stateful', '?CmdBar.Stateful');

    dev.hr(5, 20);

    dev.section('Properties', (dev) => {
      Dev.Theme.switch(dev, ['theme'], (next) => (local.theme = next));
    });

    dev.hr(5, 20);

    dev.section('Debug', (dev) => {
      dev.button('redraw', (e) => dev.redraw());
    });

    dev.hr(5, 20);

    dev.row((e) => {
      return <Root.Main.Config title={['Main', 'Config']} state={main} useStateController={true} />;
    });
  });

  e.it('ui:footer', async (e) => {
    const dev = Dev.tools<T>(e, initial);
    const state = await dev.state();
    dev.footer.border(-0.1).render<T>((e) => {
      const data = {
        props: main.current,
      };
      return <Dev.Object name={name} data={data} expand={1} fontSize={11} />;
    });
  });
});
