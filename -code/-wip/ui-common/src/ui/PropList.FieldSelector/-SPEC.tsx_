import { FieldSelector } from '.';
import { Dev, Pkg, type t } from '../../test.ui';
import { SampleFields, type MyField } from '../PropList/-dev/common';

const DEFAULTS = FieldSelector.DEFAULTS;

type P = t.PropListFieldSelectorProps;
type T = {
  props: P;
  debug: { hostBg?: boolean };
};
const initial: T = {
  props: {},
  debug: {},
};

const name = FieldSelector.displayName ?? 'Unknown';
export default Dev.describe(name, (e) => {
  type LocalStore = Pick<P, 'resettable' | 'indexes' | 'selected' | 'theme'> &
    Pick<T['debug'], 'hostBg'> & { hasTitle?: boolean };
  const localstore = Dev.LocalStorage<LocalStore>(`dev:${Pkg.name}.${name}`);
  const local = localstore.object({
    selected: undefined,
    theme: undefined,
    resettable: DEFAULTS.resettable,
    indexes: DEFAULTS.indexes,
    hostBg: false,
    hasTitle: false,
  });

  e.it('ui:init', async (e) => {
    const ctx = Dev.ctx(e);
    const state = await ctx.state<T>(initial);

    await state.change((d) => {
      d.props.title = local.hasTitle ? 'My Title' : undefined;
      d.props.resettable = local.resettable;
      d.props.indexes = local.indexes;
      d.props.selected = local.selected;
      d.props.theme = local.theme;
      d.debug.hostBg = local.hostBg;
      d.props.all = SampleFields.all;
      d.props.defaults = SampleFields.defaults;
    });

    ctx.debug.width(350);
    ctx.subject
      .size([250, null])
      .display('grid')
      .render<T>((e) => {
        const { props, debug } = e.state;
        const margin = debug.hostBg ? 10 : 0;
        Dev.Theme.background(ctx, props.theme, debug.hostBg ? 1 : 0);
        return (
          <FieldSelector
            {...props}
            style={{ margin }}
            onClick={async (event) => {
              const { value } = event.as<MyField>();
              await state.change((d) => (local.selected = d.props.selected = value.next));
              console.log('⚡️ onClick:', event);
            }}
          />
        );
      });
  });

  e.it('ui:debug', async (e) => {
    const dev = Dev.tools<T>(e, initial);
    const state = await dev.state();

    dev.section('Properties', (dev) => {
      dev.boolean((btn) => {
        const value = (state: T) => Boolean(state.props.title);
        btn
          .label((e) => (value(e.state) ? `title ("${e.state.props.title}")` : 'title'))
          .value((e) => value(e.state))
          .onClick((e) => {
            e.change((d) => {
              local.hasTitle = !value(d);
              const title = local.hasTitle ? 'My Title' : undefined;
              d.props.title = title;
            });
          });
      });

      dev.hr(-1, 5);

      dev.boolean((btn) => {
        const value = (state: T) => Boolean(state.props.indexes);
        btn
          .label((e) => `indexes (${value(e.state) ? 'visible' : 'hidden'})`)
          .value((e) => value(e.state))
          .onClick((e) => e.change((d) => (local.indexes = Dev.toggle(d.props, 'indexes'))));
      });

      dev.boolean((btn) => {
        const value = (state: T) => Boolean(state.props.resettable);
        btn
          .label((e) => `resettable`)
          .value((e) => value(e.state))
          .onClick((e) => e.change((d) => (local.resettable = Dev.toggle(d.props, 'resettable'))));
      });

      Dev.Theme.switch(dev, ['props', 'theme'], (next) => (local.theme = next));
    });

    dev.hr(5, 20);

    dev.section('Debug', (dev) => {
      dev.boolean((btn) => {
        const value = (state: T) => Boolean(state.debug.hostBg);
        btn
          .label((e) => `background`)
          .value((e) => value(e.state))
          .onClick((e) => e.change((d) => (local.hostBg = Dev.toggle(d.debug, 'hostBg'))));
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
