import { isValidElement } from 'react';

import { Dev, Pkg } from '../../test.ui';
import { DevSplash, DevSplashProps } from '.';

type T = {
  props: DevSplashProps;
  debug: {};
};
const DEFAULTS = DevSplash.DEFAULTS;
const initial: T = {
  props: {
    center: DEFAULTS.center,
    keyboard: DEFAULTS.keyboard,
    footer: ['index-0', 'index-1', Pkg.toString()],
  },
  debug: {},
};

export default Dev.describe('DevSplash', (e) => {
  e.it('ui:init', async (e) => {
    const ctx = Dev.ctx(e);
    const state = await ctx.state<T>(initial);
    ctx.subject
      .backgroundColor(1)
      .size('fill')
      .display('grid')
      .render<T>((e) => {
        return <DevSplash {...e.state.props} />;
      });
  });

  e.it('ui:debug', async (e) => {
    const dev = Dev.tools<T>(e, initial);

    dev.section('Properties', (dev) => {
      dev.boolean((btn) =>
        btn
          .label((e) => `center`)
          .value((e) => e.state.props.center)
          .onClick((e) => e.change((d) => Dev.toggle(d.props, 'center'))),
      );

      dev.boolean((btn) =>
        btn
          .label((e) => `keyboard`)
          .value((e) => e.state.props.keyboard)
          .onClick((e) => e.change((d) => Dev.toggle(d.props, 'keyboard'))),
      );

      dev.boolean((btn) =>
        btn
          .label((e) => `footer`)
          .value((e) => Boolean(e.state.props.footer))
          .onClick((e) =>
            e.change((d) => {
              const current = d.props.footer;
              const next = current ? undefined : initial.props.footer;
              d.props.footer = next;
            }),
          ),
      );
    });

    dev.hr(5, 20);

    dev.section('Samples', (dev) => {
      dev.button((btn) =>
        btn.label('none (default)').onClick((e) => {
          e.change((d) => (d.props.children = undefined));
        }),
      );

      dev.hr(-1, 5);

      dev.button((btn) =>
        btn.label('sample element: text').onClick((e) =>
          e.change((d) => {
            d.props.children = <div>hello 👋</div>;
          }),
        ),
      );

      dev.button((btn) =>
        btn.label('sample element: image').onClick((e) =>
          e.change((d) => {
            const url = 'https://euc.li/yeoro.eth';
            const width = 200;
            d.props.children = <img src={url} style={{ width, borderRadius: width }} />;
          }),
        ),
      );
    });
  });

  e.it('ui:footer', async (e) => {
    const dev = Dev.tools<T>(e, initial);
    dev.footer.border(-0.1).render<T>((e) => {
      const data = e.state;
      return <Dev.Object name={'Dev.DevHome'} data={data} expand={1} />;
    });
  });
});
