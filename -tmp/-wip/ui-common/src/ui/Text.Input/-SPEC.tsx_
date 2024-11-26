import { rx, Dev, Pkg, type t } from '../../test.ui';
import { Hints } from './-SPEC.u.Hints';
import { Sample } from './-SPEC.u.Sample';
import { DEFAULTS, KeyboardMonitor, PatchState, Time } from './common';

type P = t.TextInputProps;
type T = {
  theme?: t.CommonTheme;
  debug: {
    render: boolean;
    isHintEnabled: boolean;
    isNumericMask: boolean;
    isUpdateEnabled: boolean;
    isUpdateAsync: boolean;
    elementPlaceholder: boolean;
  };
};

const initial: T = {
  debug: {
    render: true,
    isHintEnabled: true,
    isNumericMask: false,
    isUpdateEnabled: true,
    isUpdateAsync: false,
    elementPlaceholder: false,
  },
};

const name = 'TextInput';
export default Dev.describe(name, (e) => {
  type LocalStoreDebug = T['debug'] & Pick<P, 'value' | 'theme'>;
  const localstore = Dev.LocalStorage<LocalStoreDebug>(`dev:${Pkg.name}.${name}`);
  const local = localstore.object({
    ...initial.debug,
    theme: undefined,
    value: '',
  });

  let ref: t.TextInputRef | undefined;

  // NB: used for sync changes to the state.
  const props = PatchState.create<P>({
    value: local.value,
    theme: local.theme,
    placeholder: 'my placeholder',
    focusOnReady: true,
  });

  e.it('init', async (e) => {
    const ctx = Dev.ctx(e);
    const state = await ctx.state<T>(initial);
    state.change((d) => {
      d.theme = local.theme;

      d.debug.render = local.render;
      d.debug.isHintEnabled = local.isHintEnabled;
      d.debug.isNumericMask = local.isNumericMask;
      d.debug.isUpdateEnabled = local.isUpdateEnabled;
      d.debug.isUpdateAsync = local.isUpdateAsync;
      d.debug.elementPlaceholder = local.elementPlaceholder;
    });

    props
      .events()
      .$.pipe(rx.debounceTime(50))
      .subscribe(() => ctx.redraw('subject'));

    KeyboardMonitor.on({
      ['CMD + KeyK']: (e) => props.change((d) => (d.value = '')),
      ['CMD + KeyP'](e) {
        e.handled();
        ref?.focus();
      },
    });

    ctx.subject
      .display('grid')
      .size([300, null])
      .render<T>((e) => {
        const { debug, theme } = e.state;
        if (!debug.render) return;

        const { autoSize } = props.current;
        Dev.Theme.background(ctx, theme, 1, 0.02);
        if (autoSize) ctx.subject.size('fill-x');
        else ctx.subject.size([300, null]);

        const p: t.TextInputProps = {
          ...props.current,
          theme,
          onReady(e) {
            console.log('⚡️ onReady:', e);
            ref = e.ref;
            ctx.redraw();

            // NB: disposable event subscriptions from [Ref].
            const events = e.ref.events();
            events.onChange((e) => console.info('⚡️ events$.onChange:', e));
          },
          onChange: async (e) => {
            console.info('⚡️ onChange', e);
            if (!debug.isUpdateEnabled) return;
            props.change((d) => {
              local.value = d.value = e.to;
              d.hint = debug.isHintEnabled ? Hints.lookup(e.to) : '';
            });
            ctx.redraw('subject');
          },
          onEnter(e) {
            console.info('⚡️ onEnter', e);
          },
          onEscape(e) {
            console.info('⚡️ onEscape', e);
          },
          onLabelDoubleClick(e) {
            console.info('⚡️ onLabelDoubleClick', e);
          },
          onSelect(e) {
            console.info('⚡️ onSelect', e);
          },
        };

        return <Sample props={p} debug={debug} />;
      });
  });

  e.it('ui:debug', async (e) => {
    const dev = Dev.tools<T>(e, initial);

    dev.section('Properties', (dev) => {
      Dev.Theme.switch(dev, ['theme'], (next) => (local.theme = next));

      dev.hr(-1, 5);

      function boolean(key: keyof P) {
        dev.boolean((btn) =>
          btn
            .label(key)
            .value((e) => !!props.current[key])
            .onClick((e) => props.change((d) => Dev.toggle(d, key))),
        );
      }

      boolean('isEnabled');
      boolean('isReadOnly');
      boolean('isPassword');
      dev.hr(-1, 5);
      boolean('autoCapitalize');
      boolean('autoCorrect');
      boolean('autoComplete');
      boolean('spellCheck');
      dev.hr(-1, 5);
      boolean('autoSize');
      boolean('focusOnReady');
    });

    dev.hr(5, 20);

    dev.section('Sample States', (dev) => {
      const value = (value: string, label?: string) => {
        dev.button(`text: ${label ?? value}`, (e) => {
          props.change((d) => (local.value = d.value = value));
        });
      };
      value('hello 👋');
      value(dev.lorem(50), 'long (lorem)');
      dev.hr(-1, 5);
      value('', '(clear)');
    });

    dev.hr(5, 20);

    dev.TODO(`focusActions (prop): ${DEFAULTS.focusActions.join()}`);

    dev.hr(5, 20);

    dev.section('Ref (Actions)', (dev) => {
      type F = (ref: t.TextInputRef) => void;
      const focusThen = (msecs: number, ref: t.TextInputRef, fn: F) => {
        ref.focus();
        Time.delay(msecs, () => fn(ref));
      };
      const action = (label: string, fn: F) => {
        dev.button(label, (e) => {
          if (ref) fn(ref);
        });
      };
      action('focus', (ref) => ref.focus());
      action('focus( select )', (ref) => ref.focus(true));
      action('focus → blur', (ref) => focusThen(500, ref, () => ref.blur()));
      dev.hr(-1, 5);
      action('selectAll', (ref) => focusThen(0, ref, () => ref.selectAll()));
      dev.hr(-1, 5);
      action('cursorTo → Start', (ref) => focusThen(0, ref, () => ref.caretToStart()));
      action('cursorTo → End', (ref) => focusThen(0, ref, () => ref.caretToEnd()));
    });

    dev.hr(5, 20);

    dev.section('Debug', (dev) => {
      dev.button('redraw', (e) => dev.redraw());
      dev.hr(-1, 5);
      dev.boolean((btn) =>
        btn
          .label('render')
          .value((e) => e.state.debug.render)
          .onClick((e) => {
            e.change((d) => (local.render = Dev.toggle(d.debug, 'render')));
          }),
      );

      dev.boolean((btn) => {
        const current = (state: T) => (state.debug.isUpdateEnabled ? 'enabled' : 'disabled');
        btn
          .label((e) => `update handler: ${current(e.state)}`)
          .value((e) => e.state.debug.isUpdateEnabled)
          .onClick((e) => {
            e.change((d) => (local.isUpdateEnabled = Dev.toggle(d.debug, 'isUpdateEnabled')));
          });
      });

      dev.boolean((btn) => {
        const current = (state: T) => (state.debug.isUpdateAsync ? 'asynchronous' : 'synchronous');
        btn
          .label((e) => `update async: ${current(e.state)}`)
          .value((e) => e.state.debug.isUpdateAsync)
          .onClick((e) => {
            e.change((d) => (local.isUpdateAsync = Dev.toggle(d.debug, 'isUpdateAsync')));
          });
      });

      dev.hr(-1, 5);

      dev.boolean((btn) =>
        btn
          .label((e) => `mask: isNumeric`)
          .value((e) => e.state.debug.isNumericMask)
          .onClick((e) => {
            e.change((d) => (local.isNumericMask = Dev.toggle(d.debug, 'isNumericMask')));
          }),
      );

      dev.boolean((btn) =>
        btn
          .label((e) => `hinting (auto-complete)`)
          .value((e) => e.state.debug.isHintEnabled)
          .onClick((e) => {
            e.change((d) => (local.isHintEnabled = Dev.toggle(d.debug, 'isHintEnabled')));
          }),
      );

      dev.boolean((btn) => {
        btn
          .label((e) => `placeholder: ${e.state.debug.elementPlaceholder ? '<element>' : 'text'}`)
          .value((e) => e.state.debug.elementPlaceholder)
          .onClick((e) => {
            e.change((d) => {
              local.elementPlaceholder = Dev.toggle(d.debug, 'elementPlaceholder');
            });
          });
      });
    });
  });

  e.it('ui:footer', async (e) => {
    const dev = Dev.tools<T>(e, initial);
    dev.footer.border(-0.1).render<T>((e) => {
      const data = { ref, props: props.current };
      return <Dev.Object name={name} data={data} expand={1} fontSize={11} />;
    });
  });
});
