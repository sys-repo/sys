import { CmdBar, DEFAULTS } from '.';
import { Color, css, Dev, DevIcons, Immutable, Json, Pkg, rx, Time, type t } from '../../test.ui';
import { Ctrl } from '../CmdBar.Ctrl';

type P = t.CmdBarProps;
type D = { parsedArgs?: t.ParsedArgs; focusBorder?: boolean };

/**
 * Spec
 */
const name = DEFAULTS.displayName;

export default Dev.describe(name, (e) => {
  type LocalStore = { props?: string; debug?: string };
  const localstore = Dev.LocalStorage<LocalStore>(`dev:${Pkg.name}.${name}`);
  const local = localstore.object({ props: undefined, debug: undefined });

  const Props = {
    get current(): t.CmdBarProps {
      const focusBorder = DEFAULTS.focusBorder;
      return { ...State.props.current, focusBorder };
    },
  };

  const State = {
    props: Immutable.clonerRef<P>(Json.parse<P>(local.props, DEFAULTS.props)),
    debug: Immutable.clonerRef<D>(Json.parse<D>(local.debug, {})),
  } as const;

  const issuer = 'foo:me';
  const cmdbar = CmdBar.Ctrl.create({ issuer });

  e.it('ui:init', async (e) => {
    const ctx = Dev.ctx(e);
    const dev = Dev.tools<D>(e);

    const props$ = State.props.events().changed$;
    const debug$ = State.debug.events().changed$;
    rx.merge(props$, debug$)
      .pipe(rx.debounceTime(1000))
      .subscribe(() => {
        local.props = Json.stringify(State.props.current);
        local.debug = Json.stringify(State.debug.current);
      });
    rx.merge(props$, debug$)
      .pipe(rx.debounceTime(100))
      .subscribe(() => ctx.redraw());

    cmdbar.events().on('Invoke', (e) => console.info('⚡️ cmdbar.events/Invoke', e));

    ctx.debug.width(330);
    ctx.subject
      .backgroundColor(1)
      .size('fill-x')
      .display('grid')
      .render<D>((e) => {
        const debug = State.debug.current;
        const props = Props.current;
        Dev.Theme.background(dev, props.theme, 1);

        return (
          <CmdBar
            {...props}
            cmd={Ctrl.toCmd(cmdbar)}
            focusBorder={debug.focusBorder}
            onReady={(e) => console.info('⚡️ CmdBar.onReady:', e)}
            onChange={(e) => {
              console.info(`⚡️ CmdBar.onChange:`, e);
              State.props.change((d) => (d.text = e.to));
              State.debug.change((d) => (d.parsedArgs = e.parsed));
              ctx.redraw();
            }}
          />
        );
      });
  });

  e.it('ui:debug', async (e) => {
    const dev = Dev.tools<D>(e);

    dev.section('Properties', (dev) => {
      Dev.Theme.immutable(dev, State.props);

      dev.hr(-1, 5);

      dev.boolean((btn) => {
        const state = State.props;
        const current = () => !!state.current.enabled;
        btn
          .label(() => `enabled`)
          .value(() => current())
          .onClick(() => state.change((d) => Dev.toggle(d, 'enabled')));
      });

      dev.boolean((btn) => {
        const state = State.props;
        const current = () => !!state.current.spinning;
        btn
          .label(() => `spinning`)
          .value(() => current())
          .onClick(() => state.change((d) => Dev.toggle(d, 'spinning')));
      });

      dev.boolean((btn) => {
        const state = State.props;
        const current = () => !!state.current.readOnly;
        btn
          .label(() => `readOnly`)
          .value(() => current())
          .onClick(() => state.change((d) => Dev.toggle(d, 'readOnly')));
      });

      dev.boolean((btn) => {
        const state = State.props;
        const current = () => !!state.current.focusOnReady;
        btn
          .label(() => `focusOnReady`)
          .value(() => current())
          .onClick(() => state.change((d) => Dev.toggle(d, 'focusOnReady')));
      });
    });

    dev.hr(5, 20);

    dev.section('Common States', (dev) => {
      dev.button(['hint key', '↑ ↓ ⌘K'], (e) => {
        State.props.change((d) => (d.hintKey = ['↑', '↓', '⌘K']));
      });
      dev.button('placholder: "namespace"', (e) => {
        State.props.change((d) => (d.placeholder = 'namespace'));
      });
      dev.hr(-1, 5);

      const Sample = (props: { width?: number } = {}) => {
        const { width = 30 } = props;
        const styles = {
          base: css({ backgroundColor: 'rgba(255, 0, 0, 0.1)', PaddingX: 10 }),
          grid: css({ display: 'grid', placeItems: 'center' }),
          size: css({ width, transition: `width 300ms ease` }),
        };
        return (
          <div {...css(styles.base, styles.grid, styles.size)}>
            <DevIcons.ObjectTree size={22} color={Color.WHITE} />
          </div>
        );
      };

      const prefix = (el: JSX.Element) => State.props.change((d) => (d.prefix = el));
      const suffix = (el: JSX.Element) => State.props.change((d) => (d.suffix = el));

      dev.button('element: prefix', (e) => prefix(<Sample />));
      dev.button(['element: prefix', '(wide)'], (e) => prefix(<Sample width={250} />));
      dev.hr(-1, 5);
      dev.button('element: suffix', (e) => suffix(<Sample />));
      dev.button(['element: suffix', '(wide)'], (e) => suffix(<Sample width={250} />));

      dev.hr(-1, 5);
      dev.button(['reset', '(defaults)'], (e) => {
        State.props.change((d) => {
          const defs = DEFAULTS.props;
          d.hintKey = undefined;
          d.prefix = undefined;
          d.suffix = undefined;
          d.enabled = defs.enabled;
          d.focusOnReady = defs.focusOnReady;
          d.placeholder = defs.placeholder;
        });
      });
    });

    dev.hr(5, 20);

    dev.section('Command', (dev) => {
      const focus = (target: t.CmdBarFocusTarget) => Time.delay(0, () => cmdbar.focus({ target }));
      const focusButton = (target: t.CmdBarFocusTarget) => {
        dev.button(['focus', `"${target}"`], () => focus(target));
      };
      focusButton('CmdBar');
      focusButton('Main');
      dev.hr(-1, 5);
      dev.button('current', async (e) => {
        const res = await cmdbar.current({}).promise();
        console.info('result:', res.result);
      });
    });

    dev.hr(5, 20);

    dev.section('Debug', (dev) => {
      dev.button('redraw', (e) => dev.redraw());
      dev.hr(-1, 5);
      dev.boolean((btn) => {
        const state = State.debug;
        const current = () => !!state.current.focusBorder;
        btn
          .label(() => `focusBorder`)
          .value(() => current())
          .onClick(() => state.change((d) => Dev.toggle(d, 'focusBorder')));
      });
    });
  });

  e.it('ui:footer', async (e) => {
    const dev = Dev.tools<D>(e);
    dev.footer.border(-0.1).render<D>((e) => {
      const props = Props.current;
      const debug = State.debug.current;
      const data = {
        props,
        debug,
      };
      return <Dev.Object name={name} data={data} expand={{ level: 1 }} fontSize={11} />;
    });
  });
});
