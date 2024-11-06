import { DEFAULTS, KeyHint } from '.';
import { Dev, Pkg } from '../../test.ui';
import { UserAgent, type t } from './common';

type P = t.KeyHintProps;
type T = {
  props: P;
  debug: {};
};
const initial: T = { props: {}, debug: {} };

/**
 * Spec
 */
const name = DEFAULTS.displayName.KeyHint;
export default Dev.describe(name, (e) => {
  type LocalStore = T['debug'] & Pick<P, 'text' | 'enabled' | 'theme' | 'parse' | 'os'>;
  const localstore = Dev.LocalStorage<LocalStore>(`dev:${Pkg.name}.${name}`);
  const local = localstore.object({
    text: undefined,
    theme: undefined,
    os: undefined,
    parse: DEFAULTS.parse,
    enabled: DEFAULTS.enabled,
  });

  e.it('ui:init', async (e) => {
    const ctx = Dev.ctx(e);
    const dev = Dev.tools<T>(e, initial);

    const state = await ctx.state<T>(initial);
    await state.change((d) => {
      d.props.enabled = local.enabled;
      d.props.text = local.text;
      d.props.theme = local.theme;
      d.props.os = local.os;
      d.props.parse = local.parse;
    });

    ctx.debug.width(330);
    ctx.subject.display('grid').render<T>((e) => {
      const { props } = e.state;
      Dev.Theme.background(dev, props.theme, 1);
      return <KeyHint {...props} />;
    });
  });

  e.it('ui:debug', async (e) => {
    const dev = Dev.tools<T>(e, initial);
    const state = await dev.state();
    const link = Dev.Link.pkg(Pkg, dev);

    link.button('KeyHint.Combo', `?KeyHint.Combo`);
    link.button('Cmd.Bar', '?Cmd.Bar');
    dev.hr(5, 20);

    dev.section('Properties', (dev) => {
      Dev.Theme.switch(dev, ['props', 'theme'], (next) => (local.theme = next));
      dev.hr(-1, 5);

      dev.boolean((btn) => {
        const value = (state: T) => !!state.props.enabled;
        btn
          .label((e) => `enabled`)
          .value((e) => value(e.state))
          .onClick((e) => e.change((d) => Dev.toggle(d.props, 'enabled')));
      });

      dev.boolean((btn) => {
        const value = (state: T) => !!state.props.parse;
        btn
          .label((e) => `parse`)
          .value((e) => value(e.state))
          .onClick((e) => e.change((d) => Dev.toggle(d.props, 'parse')));
      });

      dev.hr(-1, 5);

      [undefined, ...UserAgent.os.kinds].forEach((os) => {
        const name = !os ? '<undefined>' : os;
        dev.button((btn) => {
          btn
            .label(`os: ${name}`)
            .right((e) => (e.state.props.os === os ? `←` : ''))
            .enabled((e) => true)
            .onClick((e) => e.change((d) => (local.os = d.props.os = os)));
        });
      });
    });

    dev.hr(5, 20);

    dev.section('Common States', (dev) => {
      const btn = (value: string | undefined, label?: string) => {
        dev.button(value || label || 'err', (e) => {
          e.change((d) => (local.text = d.props.text = value));
        });
      };

      btn(undefined, '<undefined>');
      dev.hr(-1, 5);
      btn('META + K');
      btn('Meta K');
      btn('CMD K');
      btn('META +   ?');
      dev.hr(-1, 5);
      btn('CMD + ALT + SHIFT + CTRL + P');
    });

    dev.hr(5, 20);

    dev.section('Debug', (dev) => {
      dev.button('redraw', (e) => dev.redraw());
    });
  });

  e.it('ui:footer', async (e) => {
    const dev = Dev.tools<T>(e, initial);
    const state = await dev.state();
    dev.footer.border(-0.1).render<T>((e) => {
      const { props } = e.state;
      const data = { props };
      return <Dev.Object name={name} data={data} expand={1} fontSize={11} />;
    });
  });
});
