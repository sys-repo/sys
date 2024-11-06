import { DEFAULTS, TextboxSync } from '.';
import { Dev, Immutable, Pkg, type t } from '../../test.ui';

type T = { theme?: t.CommonTheme; path?: t.ObjectPath };
const initial: T = {};

/**
 * Spec
 */
const name = DEFAULTS.displayName;

export default Dev.describe(name, (e) => {
  type LocalStore = Pick<T, 'theme' | 'path'>;
  const localstore = Dev.LocalStorage<LocalStore>(`dev:${Pkg.name}.${name}`);
  const local = localstore.object({
    theme: 'Dark',
    path: ['text'],
  });

  const doc = Immutable.clonerRef({});

  e.it('ui:init', async (e) => {
    const ctx = Dev.ctx(e);
    const dev = Dev.tools<T>(e, initial);

    const state = await ctx.state<T>(initial);
    await state.change((d) => {
      d.theme = local.theme;
      d.path = local.path;
    });

    ctx.debug.width(330);
    ctx.subject
      .size([null, null])
      .display('grid')
      .render<T>((e) => {
        const { theme, path } = e.state;
        Dev.Theme.background(ctx, theme, 1);
        return <TextboxSync.Dev.Layout state={doc} theme={theme} path={path} />;
      });
  });

  e.it('ui:debug', async (e) => {
    const dev = Dev.tools<T>(e, initial);
    const state = await dev.state();
    const link = Dev.Link.pkg(Pkg, dev);

    dev.section('Properties', (dev) => {
      Dev.Theme.switch(dev, ['theme'], (e) => (local.theme = e));
      dev.hr(-1, 5);
      const path = (path: t.ObjectPath) => {
        dev.button(`path: [ ${path?.join('.')} ]`, (e) => {
          e.change((d) => (local.path = d.path = path));
        });
      };
      path(['text']);
      path(['foo', 'text']);
    });

    dev.hr(5, 20);

    dev.section('Debug', (dev) => {
      dev.button('redraw', (e) => dev.redraw());
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
