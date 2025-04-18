import { Button } from '.';
import { Dev, slug, type t } from '../../test.ui';

const DEFAULTS = Button.DEFAULTS;
type T = { props: t.CopyButtonProps };
const initial: T = { props: {} };

/**
 * Spec
 */
const name = Button.Copy.displayName ?? '';

export default Dev.describe(name, (e) => {
  type LocalStore = Pick<t.CopyButtonProps, 'enabled' | 'spinning' | 'theme'>;
  const localstore = Dev.LocalStorage<LocalStore>('dev:sys.ui.common.Button.Copy');
  const local = localstore.object({
    enabled: DEFAULTS.enabled,
    spinning: DEFAULTS.spinning,
    theme: undefined,
  });

  e.it('ui:init', async (e) => {
    const ctx = Dev.ctx(e);
    const dev = Dev.tools<T>(e, initial);

    const state = await ctx.state<T>(initial);
    await state.change((d) => {
      d.props.enabled = local.enabled;
      d.props.spinning = local.spinning;
      d.props.theme = local.theme;
    });

    ctx.debug.width(330);
    ctx.subject
      .backgroundColor(1)
      .display('grid')
      .render<T>((e) => {
        const { props } = e.state;
        Dev.Theme.background(ctx, props.theme, 1);

        return (
          <Button.Copy
            {...props}
            onClick={(e) => console.info('⚡️ onClick')}
            onCopy={(e) => {
              console.info('⚡️ onCopy', e);
              e.copy(`My Text (${slug()})`);
              // e.delay(1200);
              // e.message('Foobar');
            }}
          >
            {'My Text Button'}
          </Button.Copy>
        );
      });
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
          .onClick((e) => e.change((d) => (local.enabled = Dev.toggle(d.props, 'enabled'))));
      });

      dev.boolean((btn) => {
        const value = (state: T) => Boolean(state.props.spinning);
        btn
          .label((e) => `spinning`)
          .value((e) => value(e.state))
          .onClick((e) => e.change((d) => (local.spinning = Dev.toggle(d.props, 'spinning'))));
      });
    });

    dev.hr(5, 20);
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
