import { Dev } from '../../../test.ui';
import { Sample } from './-SPEC.Sample';
import { DEFAULTS } from './-common';

type T = {
  enabled?: boolean;
  suppressGlobal?: boolean;
  render?: boolean;
};
const initial: T = {};

export default Dev.describe('useDragTarget', (e) => {
  type LocalStore = T;
  const localstore = Dev.LocalStorage<LocalStore>('dev:sys.ui.common.useDragTarget');
  const local = localstore.object({
    enabled: DEFAULTS.enabled,
    suppressGlobal: DEFAULTS.suppressGlobal,
    render: true,
  });

  e.it('ui:init', async (e) => {
    const ctx = Dev.ctx(e);
    const state = await ctx.state<T>(initial);

    await state.change((d) => {
      d.enabled = local.enabled;
      d.suppressGlobal = local.suppressGlobal;
      d.render = local.render;
    });

    ctx.debug.width(330);
    ctx.subject
      .backgroundColor(1)
      .size('fill')
      .display('grid')
      .render<T>((e) => {
        if (!e.state.render) return <div />;
        return <Sample enabled={e.state.enabled} suppressGlobal={e.state.suppressGlobal} />;
      });
  });

  e.it('ui:debug', async (e) => {
    const dev = Dev.tools<T>(e, initial);
    const state = await dev.state();

    dev.section('Arguments', (dev) => {
      dev.boolean((btn) =>
        btn
          .label((e) => `enabled`)
          .value((e) => Boolean(e.state.enabled))
          .onClick((e) => e.change((d) => (local.enabled = Dev.toggle(d, 'enabled')))),
      );

      dev.boolean((btn) =>
        btn
          .label((e) => `suppressGlobal`)
          .value((e) => Boolean(e.state.suppressGlobal))
          .onClick((e) =>
            e.change((d) => (local.suppressGlobal = Dev.toggle(d, 'suppressGlobal'))),
          ),
      );
    });

    dev.hr(5, 20);

    dev.section('Debug', (dev) => {
      dev.boolean((btn) =>
        btn
          .label((e) => `render`)
          .value((e) => Boolean(e.state.render))
          .onClick((e) => e.change((d) => (local.render = Dev.toggle(d, 'render')))),
      );

      dev.hr(-1, 5);

      dev.button('reset', (e) => {
        state.change((d) => {
          local.enabled = d.enabled = DEFAULTS.enabled;
          local.suppressGlobal = d.suppressGlobal = DEFAULTS.suppressGlobal;
          local.render = d.render = true;
        });
      });
    });
  });

  e.it('ui:footer', async (e) => {
    const dev = Dev.tools<T>(e, initial);
    dev.footer.border(-0.1).render<T>((e) => {
      const data = e.state;
      return <Dev.Object name={'useDragTarget'} data={data} expand={1} />;
    });
  });
});
