import { css, Dev, Icons } from '../../test.ui';
import { Switch } from '../common';
import { Button } from './ui.Button';

import type { ButtonProps } from './ui.Button';

type T = {
  count: number;
  props: ButtonProps;
  debug: { enabled: boolean; spinning: boolean };
};
const initial: T = {
  count: 0,
  props: { rightElement: <div>123</div>, onClick: (e) => console.info(`⚡️ onClick`) },
  debug: { enabled: true, spinning: false },
};

export default Dev.describe('Button', (e) => {
  const tmp = {
    count: 0,
  };

  e.it('init', async (e) => {
    const ctx = Dev.ctx(e);
    await ctx.state<T>(initial);
    ctx.subject
      .display('grid')
      .size([250, null])
      .render<T>((e) => <Button {...e.state.props} />);
  });

  e.it('ui:debug', async (e) => {
    const dev = Dev.tools<T>(e, initial);

    dev.button((btn) => {
      btn
        .label(`my icon`)
        .icon(() => <Icons.Face size={18} offset={[0, 2]} />)
        .onClick((e) => {});
    });

    dev.hr(-1, 5);

    dev.section((dev) => {
      dev
        .button('state: increment count', async (e) => {
          await e.change((d) => d.count++);
          e.label(`state: count-${e.state.current.count}`);
        })
        .button((btn) => {
          let count = 0;
          return btn.label('rename (self)').onClick((e) => {
            count++;
            e.label(`renamed-${count} (within closure)`);
          });
        })
        .button((btn) => {
          return btn
            .label((e) => {
              const bg = e.dev.subject.backgroundColor ?? 0;
              const count = e.state.count;
              return `change props: (props-${bg}) / state-${count}`;
            })
            .onClick((e) => e.ctx.subject.backgroundColor(1));
        })
        /**
         * Shorthand: "label", "onClick" parameter declaration.
         */
        .button('no `onClick`');
    });

    dev.hr(5, 15);

    dev.section((dev) => {
      dev
        .button('right: clear', (e) => e.change(({ props }) => (props.rightElement = undefined)))
        .button('right: `<Switch>`', (e) =>
          e.change(({ props }) => (props.rightElement = <Switch height={16} />)),
        )
        .button('right: `<div>123</div>`', (e) =>
          e.change(({ props }) => (props.rightElement = <div>123</div>)),
        );

      dev.button((btn) => {
        btn
          .label(`right: false`)
          .right((e) => `←`)
          .onClick((e) => {});
      });
    });

    dev.hr(5, 15);

    dev.section((dev) => {
      dev.button((btn) =>
        btn
          .label((e) => `ƒ → "string left" (${tmp.count})`)
          .right((e) => {
            const style = css({
              PaddingX: 10,
              PaddingY: 2,
              borderRadius: 10,
              backgroundColor: 'rgba(255, 0, 0, 0.1)' /* RED */,
            });
            return <div {...style}>element right</div>;
          })
          .onClick((e) => {
            console.log('click');
            e.redraw();
          }),
      );

      dev.button((btn) => btn.label('"string left"').right('"string right"'));
      dev.button(['[ "left", 🐷 ]', '[ 🐷, "right" ]'], () => {});
    });

    dev.hr(5, 15);

    dev.section((dev) => {
      dev.boolean((btn) =>
        btn
          .label('debug.enabled')
          .value((e) => e.state.debug.enabled)
          .onClick((e) => e.change((d) => Dev.toggle(d.debug, 'enabled'))),
      );

      dev.button((btn) =>
        btn
          .label((e) => `my button (${e.state.debug.enabled ? 'enabled' : 'disabled'})`)
          .enabled((e) => e.state.debug.enabled)
          .onClick((e) => console.info('click')),
      );
    });

    dev.hr(5, 15);

    dev.section((dev) => {
      dev.boolean((btn) =>
        btn
          .label('debug.spinning')
          .value((e) => e.state.debug.spinning)
          .onClick((e) => e.change((d) => Dev.toggle(d.debug, 'spinning'))),
      );

      dev.button((btn) =>
        btn
          .label((e) => `button ${e.state.debug.spinning ? '(stop)' : ' (start)'}`)
          .spinner((e) => e.state.debug.spinning)
          .right('right value')
          .onClick((e) => e.change((d) => Dev.toggle(d.debug, 'spinning'))),
      );
    });

    dev.hr(5, 15);

    dev.section('Redraw', (dev) => {
      dev.button('tmp.count ++', (e) => tmp.count++);
      dev.hr(-1, 5);
      dev.button('dev.redraw', (e) => dev.redraw());
      dev.button('dev.redraw( "debug" )', (e) => dev.redraw('debug'));
      dev.button('dev.redraw( "harness" )', (e) => dev.redraw('harness'));
      dev.button('dev.redraw( "subject" )', (e) => dev.redraw('subject'));
    });
  });

  e.it('ui:footer', async (e) => {
    const dev = Dev.tools<T>(e, initial);

    dev.footer.border(-0.1).render<T>((e) => {
      const data = {
        tmp,
        props: e.state.props,
      };
      return <Dev.Object name={'Dev.Button'} data={data} expand={1} />;
    });
  });
});
