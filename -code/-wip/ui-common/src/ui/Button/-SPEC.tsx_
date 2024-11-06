import { Button } from '.';
import { Delete, Dev, Pkg, type t } from '../../test.ui';

const DEFAULTS = Button.DEFAULTS;

type T = {
  props: t.ButtonProps;
  debug: { useLabel?: boolean; padding?: boolean };
};
const initial: T = {
  props: {},
  debug: {},
};

const name = Button.displayName ?? 'Unknown';
export default Dev.describe(name, (e) => {
  type LocalStore = T['debug'] &
    Pick<
      t.ButtonProps,
      | 'theme'
      | 'enabled'
      | 'active'
      | 'block'
      | 'spinning'
      | 'tooltip'
      | 'label'
      | 'isOver'
      | 'isDown'
    >;
  const localstore = Dev.LocalStorage<LocalStore>(`dev:${Pkg.name}.${name}`);
  const local = localstore.object({
    theme: undefined,
    useLabel: true,
    padding: false,
    enabled: DEFAULTS.enabled,
    active: DEFAULTS.active,
    block: DEFAULTS.block,
    spinning: DEFAULTS.spinning,
    tooltip: 'My Button',
    label: 'Hello-🐷',
    isOver: undefined,
    isDown: undefined,
  });

  e.it('init', async (e) => {
    const ctx = Dev.ctx(e);
    const state = await ctx.state<T>(initial);

    await state.change((d) => {
      d.props.theme = local.theme;
      d.props.enabled = local.enabled;
      d.props.active = local.active;
      d.props.block = local.block;
      d.props.spinning = local.spinning;
      d.props.tooltip = local.tooltip;
      d.props.label = local.label;
      d.props.isOver = local.isOver;
      d.props.isDown = local.isDown;
      d.debug.useLabel = local.useLabel;
      d.debug.padding = local.padding;
    });

    ctx.subject.display('grid').render<T>((e) => {
      const { debug } = e.state;
      Dev.Theme.background(ctx, e.state.props.theme);

      const props = {
        ...e.state.props,
        padding: debug.padding ? 20 : undefined,
      };

      if (debug.useLabel) {
        props.label = 'Label-🐷';
        props.children = undefined;
      } else {
        props.label = undefined;
        props.children = <div>{'My Child Element'}</div>;
      }

      return (
        <Button
          {...props}
          onMouse={(e) => console.info(`⚡️ onMouse`, e)}
          onClick={(e) => {
            console.info('⚡️ onClick', e);
            // state.change((d) => Dev.toggle(d.props, 'spinning'));
          }}
        />
      );
    });
  });

  e.it('ui:debug', async (e) => {
    const dev = Dev.tools<T>(e, initial);

    dev.section('Properties', (dev) => {
      Dev.Theme.switch(dev, ['props', 'theme'], (next) => (local.theme = next));

      dev.boolean((btn) =>
        btn
          .label('enabled')
          .value((e) => e.state.props.enabled)
          .onClick((e) => e.change((d) => (local.enabled = Dev.toggle(d.props, 'enabled')))),
      );

      dev.boolean((btn) =>
        btn
          .label('active')
          .value((e) => e.state.props.active)
          .onClick((e) => e.change((d) => (local.active = Dev.toggle(d.props, 'active')))),
      );

      dev.boolean((btn) =>
        btn
          .label((e) => 'spinning')
          .value((e) => e.state.props.spinning)
          .onClick((e) => e.change((d) => (local.spinning = Dev.toggle(d.props, 'spinning')))),
      );

      dev.hr(-1, 5);

      dev.boolean((btn) => {
        const value = (state: T) => !!state.props.isOver;
        btn
          .label((e) => `isOver (force)`)
          .value((e) => value(e.state))
          .onClick((e) => e.change((d) => (local.isOver = Dev.toggle(d.props, 'isOver'))));
      });
      dev.boolean((btn) => {
        const value = (state: T) => !!state.props.isDown;
        btn
          .label((e) => `isDown (force)`)
          .value((e) => value(e.state))
          .onClick((e) => e.change((d) => (local.isDown = Dev.toggle(d.props, 'isDown'))));
      });

      dev.hr(-1, 5);

      dev.boolean((btn) =>
        btn
          .label('block')
          .value((e) => e.state.props.block)
          .onClick((e) => e.change((d) => (local.block = Dev.toggle(d.props, 'block')))),
      );

      dev.boolean((btn) => {
        const value = (state: T) => !!state.props.overlay;
        btn
          .label((e) => `overlay (Element)`)
          .value((e) => value(e.state))
          .onClick((e) => {
            e.change((d) => {
              const el = <div style={{ fontSize: 11 }}>{`Overlay 🐷`}</div>;
              d.props.overlay = d.props.overlay ? undefined : el;
            });
          });
      });
    });

    dev.hr(5, 20);

    dev.section('Debug', (dev) => {
      dev.button((btn) =>
        btn
          .label('content: <Element>')
          .right((e) => (!e.state.debug.useLabel ? '← current' : ''))
          .onClick((e) => e.change((d) => (local.useLabel = d.debug.useLabel = false))),
      );

      dev.button((btn) =>
        btn
          .label('content: "label" property (string)')
          .right((e) => (e.state.debug.useLabel ? '← current' : ''))
          .onClick((e) => e.change((d) => (local.useLabel = d.debug.useLabel = true))),
      );

      dev.hr(-1, 5);

      dev.boolean((btn) =>
        btn
          .label((e) => `padding`)
          .value((e) => Boolean(e.state.debug.padding))
          .onClick((e) => e.change((d) => (local.padding = Dev.toggle(d.debug, 'padding')))),
      );
    });
  });

  e.it('ui:footer', async (e) => {
    const dev = Dev.tools<T>(e, initial);
    dev.footer.border(-0.1).render<T>((e) => {
      const data = { props: Delete.undefined(e.state.props) };
      return <Dev.Object name={name} data={data} expand={1} />;
    });
  });
});
