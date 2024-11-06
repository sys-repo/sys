import { DEFAULTS } from '.';
import { Color, Dev, Immutable, ObjectPath, Pkg, Time, css, rx } from '../../test.ui';
import { CmdBar } from '../CmdBar';
import { SampleCmdBarStateful } from './-ui';
import { type t, ObjectView } from './common';

type P = t.CmdBarStatefulProps;
type T = {
  props: P;
  debug: { render?: boolean; useState?: boolean; prependPaths?: boolean };
  current: { isFocused?: boolean; argv?: string };
};
const initial: T = { props: {}, debug: {}, current: {} };

/**
 * Spec
 */
const name = DEFAULTS.displayName;

export default Dev.describe(name, (e) => {
  type LocalStore = { main?: string } & T['debug'] &
    Pick<P, 'theme' | 'enabled' | 'focusOnReady' | 'useKeyboard' | 'useHistory'> &
    Pick<T['current'], 'argv'>;
  const localstore = Dev.LocalStorage<LocalStore>(`dev:${Pkg.name}.${name}`);
  const local = localstore.object({
    theme: 'Dark',
    main: undefined,
    enabled: true,
    focusOnReady: DEFAULTS.focusOnReady,
    useKeyboard: DEFAULTS.useKeyboard,
    useHistory: DEFAULTS.useHistory,
    prependPaths: true,
    useState: true,
    argv: undefined,
  });

  const main = Immutable.clonerRef<t.MainProps>(local.main ? JSON.parse(local.main) : {});
  const doc = Immutable.clonerRef({});

  const issuer = 'foo:me';
  let cmdbar: t.CmdBarRef | undefined;

  const getPaths = (state: T): t.CmdBarPaths => {
    return state.debug.prependPaths ? CmdBar.Path.prepend(['prepended-foo']) : DEFAULTS.paths;
  };

  const getText = (state: T) => {
    const paths = getPaths(state)!;
    const text = doc ? ObjectPath.resolve<string>(doc.current, paths.text) ?? '' : '';
    return text;
  };

  e.it('ui:init', async (e) => {
    const ctx = Dev.ctx(e);
    const dev = Dev.tools<T>(e, initial);

    const state = await ctx.state<T>(initial);
    await state.change((d) => {
      d.props.theme = local.theme;
      d.props.enabled = local.enabled;
      d.props.focusOnReady = local.focusOnReady;
      d.props.useKeyboard = local.useKeyboard;
      d.props.useHistory = local.useHistory;
      d.debug.useState = local.useState;
      d.debug.render = true;
      d.debug.prependPaths = local.prependPaths;
      d.current.argv = local.argv;
    });

    doc.change((d) => {
      const paths = getPaths(state.current);
      ObjectPath.Mutate.value(d, paths.text, local.argv);
    });

    const doc$ = doc.events().changed$;
    const main$ = main.events().changed$;
    rx.merge(doc$, main$)
      .pipe(rx.debounceTime(100))
      .subscribe(() => dev.redraw());

    main$.pipe(rx.debounceTime(100)).subscribe(() => (local.main = JSON.stringify(main.current)));

    /**
     * Render: <CmdBar>
     */
    const renderCommandBar = () => {
      const { props, debug } = state.current;
      const paths = getPaths(state.current);

      if (!debug.render) return null;

      const t = (prop: string, time: t.Msecs = 50) => `${prop} ${time}ms`;
      const transition = [t('opacity'), t('border')].join(', ');
      const isFocused = cmdbar?.current.focused;
      const styles = {
        base: css({ position: 'relative' }),
        label: css({
          Absolute: [-22, 8, null, null],
          fontFamily: 'monospace',
          fontSize: 10,
          opacity: isFocused ? 1 : 0.25,
          transition,
        }),
      };

      const elCmdBar = (
        <SampleCmdBarStateful
          {...props}
          issuer={issuer}
          state={debug.useState ? doc : undefined}
          paths={paths}
          // paths={['sample-foo']}
          onReady={(e) => {
            const { textbox, dispose$ } = e;
            cmdbar = e.cmdbar;

            console.info('⚡️ CmdBar.Stateful.onReady:', e);
            dispose$.subscribe(() => console.info('⚡️ CmdBar.Stateful.onReady:dispose$ → 💥'));

            // Start data-binding syncer.
            const syncer = CmdBar.Sync.listen(textbox, doc, e.paths.text, { dispose$ });
            state.change((d) => (d.current.argv = e.initial.text));
            syncer.onChange((e) => console.info(`syncer.onChange`, e));

            // Listen for events.
            const events = e.cmdbar.ctrl.events(e.dispose$);
            events.on('Invoke', (e) => {
              const issuer = `issuer: "${e.issuer}"`;
              console.info(`⚡️ Invoke`, e.params, issuer);
            });
          }}
          onFocusChange={(e) => state.change((d) => (d.current.isFocused = e.is.focused))}
          onChange={(e) => state.change((d) => (local.argv = d.current.argv = e.to))}
        />
      );

      return (
        <div {...styles.base}>
          <div {...styles.label}>{'cmdbar'}</div>
          {elCmdBar}
        </div>
      );
    };

    ctx.debug.width(330);
    ctx.subject
      .size('fill')
      .display('grid')
      .render<T>((e) => {
        const { props, current } = e.state;
        const theme = Color.theme(props.theme);
        Dev.Theme.background(dev, theme, 1);

        const styles = {
          base: css({
            backgroundColor: 'rgba(255, 0, 0, 0.1)' /* RED */,
          }),
        };

        const ctrl = cmdbar;
        return (
          <CmdBar.Dev.Main
            style={styles.base}
            theme={theme.name}
            fields={main.current.fields}
            argsCard={{
              ctrl,
              argv: current.argv,
              focused: { cmdbar: cmdbar?.current.focused },
            }}
            run={{
              ctrl,
              argv: current.argv,

              onArgsChanged(e) {
                if (!e.argv) return;

                const styles = {
                  base: css({
                    backgroundColor: 'rgba(255, 0, 0, 0.05)' /* RED */,
                    padding: 15,
                  }),
                };

                e.render(
                  <div {...styles.base}>
                    <ObjectView name={'run'} data={e.args} theme={e.theme} expand={3} />
                  </div>,
                );
              },

              async onInvoke(e) {
                if (e.argv === 'null') return e.render(null);
                e.render(<div {...styles.base}>{`Invoked ⚡️`}</div>);
              },
            }}
          />
        );
      });

    /**
     * Footer: <CmdBar>
     */
    ctx.host.footer.padding(0).render((e) => renderCommandBar());
  });

  e.it('ui:debug', async (e) => {
    const dev = Dev.tools<T>(e, initial);
    const state = await dev.state();

    dev.section('Properties', (dev) => {
      Dev.Theme.switch(dev, ['props', 'theme'], (next) => (local.theme = next));
      dev.hr(-1, 5);
      dev.boolean((btn) => {
        const value = (state: T) => Boolean(state.props.enabled);
        btn
          .label((e) => `enabled`)
          .value((e) => value(e.state))
          .onClick((e) => {
            e.change((d) => (local.enabled = Dev.toggle(d.props, 'enabled')));
          });
      });
      dev.boolean((btn) => {
        const value = (state: T) => Boolean(state.props.focusOnReady);
        btn
          .label((e) => `focusOnReady`)
          .value((e) => value(e.state))
          .onClick((e) => {
            e.change((d) => (local.focusOnReady = Dev.toggle(d.props, 'focusOnReady')));
          });
      });
      dev.hr(-1, 5);
      dev.boolean((btn) => {
        const value = (state: T) => !!state.props.useKeyboard;
        btn
          .label((e) => `useKeyboard`)
          .value((e) => value(e.state))
          .onClick((e) => {
            e.change((d) => (local.useKeyboard = Dev.toggle(d.props, 'useKeyboard')));
          });
      });

      dev.boolean((btn) => {
        const value = (state: T) => !!state.props.useHistory;
        btn
          .label((e) => `useHistory`)
          .value((e) => value(e.state))
          .onClick((e) => {
            e.change((d) => (local.useHistory = Dev.toggle(d.props, 'useHistory')));
          });
      });
    });

    dev.hr(5, 20);

    dev.section('Command', (dev) => {
      const focus = (target: t.CmdBarFocusTarget) =>
        Time.delay(0, () => cmdbar?.ctrl.focus({ target }));
      const focusButton = (target: t.CmdBarFocusTarget) => {
        dev.button(['focus', `"${target}"`], () => focus(target));
      };

      const getCurrent = async () => (await cmdbar?.ctrl.current({}).promise())?.result;

      focusButton('Main');
      focusButton('CmdBar');
      dev.hr(-1, 5);
      dev.button('invoke', () => {
        const text = getText(state.current);
        cmdbar?.ctrl.invoke({ text });
      });
      dev.hr(-1, 5);
      dev.button('select: All', () => cmdbar?.ctrl.select({ scope: 'All' }));
      dev.button('select: Expand', () => cmdbar?.ctrl.select({ scope: 'Expand' }));
      dev.hr(-1, 5);
      dev.button('update: text → "foo"', () => cmdbar?.ctrl.update({ text: 'foo' }));
      dev.button('update: toggle → spinning', async () => {
        const spinning = !((await getCurrent())?.spinning ?? false);
        cmdbar?.ctrl.update({ spinning });
      });
      dev.button('update: toggle → readOnly', async () => {
        const readOnly = !((await getCurrent())?.readOnly ?? false);
        cmdbar?.ctrl.update({ readOnly });
      });
      dev.hr(-1, 5);
      dev.button('clear', () => cmdbar?.ctrl.clear({}));
      dev.button('current', async () => console.info('current', await getCurrent()));
      dev.hr(-1, 5);

      const keyboardAction = (name: t.KeyboardAction['name']) => cmdbar?.ctrl.keyboard({ name });
      dev.button(['CMD + J', 'focus: Main'], () => keyboardAction('Focus:Main'));
      dev.button(['CMD + K', 'focus: CmdBar'], () => keyboardAction('Focus:CmdBar'));
    });

    dev.hr(5, 20);

    dev.section('Debug', (dev) => {
      dev.button('redraw', (e) => dev.redraw());
      dev.hr(-1, 5);

      dev.boolean((btn) => {
        const value = (state: T) => !!state.debug.render;
        btn
          .label((e) => `render`)
          .value((e) => value(e.state))
          .onClick((e) => e.change((d) => Dev.toggle(d.debug, 'render')));
      });

      dev.boolean((btn) => {
        const value = (state: T) => !!state.debug.useState;
        btn
          .label((e) => `state${value(e.state) ? '' : ': undefined'}`)
          .value((e) => value(e.state))
          .onClick((e) => e.change((d) => (local.useState = Dev.toggle(d.debug, 'useState'))));
      });
      dev.boolean((btn) => {
        const value = (state: T) => !!state.debug.prependPaths;
        btn
          .label((e) => (value(e.state) ? `prepend paths` : `prepend paths: (default)`))
          .value((e) => value(e.state))
          .onClick((e) => {
            e.change((d) => (local.prependPaths = Dev.toggle(d.debug, 'prependPaths')));
          });
      });
    });

    dev.hr(5, 20);

    dev.row((e) => {
      return <CmdBar.Dev.Main.Config title={'Config'} state={main} useStateController={true} />;
    });
  });

  e.it('ui:footer', async (e) => {
    const dev = Dev.tools<T>(e, initial);
    const state = await dev.state();
    dev.footer.border(-0.1).render<T>((e) => {
      const { debug } = e.state;
      const data = {
        props: e.state.props,
        'state( Immutable<D> )': debug.useState ? doc?.current : undefined,
      };
      return <Dev.Object name={name} data={data} expand={{ level: 1 }} fontSize={11} />;
    });
  });
});
