import { ModuleList } from 'sys.ui.react.dev';
import { type ModuleListProps } from 'sys.ui.react.dev/src/types';
import { BADGES, Dev, Pkg, css } from '../../test.ui';

type P = ModuleListProps;
type T = { props: P };
const initial: T = { props: {} };
const DEFAULTS = ModuleList.DEFAULTS;

/**
 * Spec
 */
const name = 'ModuleList';

export default Dev.describe(name, (e) => {
  type LocalStore = Pick<P, 'theme' | 'title' | 'version' | 'showParamDev' | 'useAnchorLinks'>;
  const localstore = Dev.LocalStorage<LocalStore>(`dev:${Pkg.name}.${name}`);
  const local = localstore.object({
    theme: undefined,
    title: 'MyTitle',
    version: '0.0.0',
    showParamDev: DEFAULTS.showParamDev,
    useAnchorLinks: DEFAULTS.useAnchorLinks,
  });

  e.it('ui:init', async (e) => {
    const ctx = Dev.ctx(e);
    const dev = Dev.tools<T>(e, initial);
    const { Specs } = await import('../../test.ui/entry.Specs');

    const state = await ctx.state<T>(initial);
    await state.change((d) => {
      const p = d.props;
      p.theme = local.theme;
      p.title = local.title;
      p.version = local.version;
      p.showParamDev = local.showParamDev;
      p.useAnchorLinks = local.useAnchorLinks;

      p.imports = Specs;
      p.badge = BADGES.ci.node;
      p.hrDepth = 3;
    });

    ctx.debug.width(360);
    ctx.subject
      .backgroundColor(1)
      .size('fill')
      .display('grid')
      .render<T>((e) => {
        const { props } = e.state;
        Dev.Theme.background(ctx, props.theme, 1);

        const styles = {
          base: css({
            Absolute: 0,
            display: 'grid',
            Scroll: true,
          }),
        };
        return (
          <div {...styles.base}>
            <ModuleList {...props} onItemClick={(e) => console.info('⚡️ onItemClick', e)} />
          </div>
        );
      });
  });

  e.it('ui:debug', async (e) => {
    const dev = Dev.tools<T>(e, initial);
    const state = await dev.state();
    const { Specs } = await import('../../test.ui/entry.Specs');

    dev.section('Common States', (dev) => {
      dev.button('(empty)', (e) => {
        state.change((d) => (d.props.imports = undefined));
      });

      dev.hr(-1, 5);

      dev.button(`all specs from: [${Pkg.name}]`, (e) => {
        state.change((d) => (d.props.imports = Specs));
      });

      const filteredOn = (filter: string) => {
        dev.button(`↑ filtered: "${filter}"`, (e) => {
          state.change((d) => {
            const imports = new Map(Object.entries(Specs));
            Array.from(imports.keys())
              .filter((key) => !key.startsWith(filter))
              .forEach((key) => imports.delete(key));
            d.props.imports = Object.fromEntries(imports);
          });
        });
      };

      filteredOn('sys.ui.sample');
      filteredOn('sys.ui.dev');
    });

    dev.hr(5, 20);

    dev.section('Properties', (dev) => {
      Dev.Theme.switcher(
        dev,
        (d) => d.props.theme,
        (d, value) => (local.theme = d.props.theme = value),
      );

      dev.hr(-1, 5);

      dev.boolean((btn) => {
        const value = (state: T) => !!state.props.showParamDev;
        btn
          .label((e) => `showParam ("?dev")`)
          .value((e) => value(e.state))
          .onClick((e) =>
            e.change((d) => (local.showParamDev = Dev.toggle(d.props, 'showParamDev'))),
          );
      });

      dev.boolean((btn) => {
        const value = (state: T) => !!state.props.useAnchorLinks;
        btn
          .label((e) => `useAnchorLinks`)
          .value((e) => value(e.state))
          .onClick((e) => e.change((d) => Dev.toggle(d.props, 'useAnchorLinks')));
      });
    });
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
