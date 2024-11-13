import { Card } from '.';
import { Color, COLORS, css, Dev, Keyboard, type t } from '../../test.ui';

type T = {
  props: t.CardProps;
  debug: {
    flipFast: boolean;
    focusable: boolean;
    header: boolean;
    body: boolean;
    footer: boolean;
  };
};
const initial: T = {
  props: {
    padding: [25, 30],
    userSelect: false,
    shadow: true,
    showAsCard: true,
    showBackside: false,
  },
  debug: {
    flipFast: true,
    focusable: true,
    header: false,
    body: true,
    footer: true,
  },
};

export default Dev.describe('Card', (e) => {
  e.it('init', async (e) => {
    const ctx = Dev.ctx(e);
    const state = await ctx.state<T>(initial);

    ctx.subject
      .display('grid')
      .size([450, null])
      .render<T>((e) => {
        const { props, debug } = e.state;

        const styles = {
          body: css({
            backgroundColor: 'rgba(255, 0, 0, 0.03)' /* RED */,
            lineHeight: 1.3,
          }),
          header: css({
            Padding: [8, 10],
            borderBottom: `solid 1px ${Color.alpha(COLORS.DARK, 0.1)}`,
          }),
          footer: css({
            Padding: [8, 10],
            borderTop: `solid 1px ${Color.alpha(COLORS.DARK, 0.1)}`,
          }),
        };

        const elBody = debug.body && <div {...styles.body}>{Dev.Lorem.toString()}</div>;
        const elBackside = <div {...styles.body}>{`🐷 Backside`}</div>;

        const elHeader = debug.header && <div {...styles.header}>Header</div>;
        const elFooter = debug.footer && <div {...styles.footer}>Footer</div>;
        const elBacksideHeader = debug.header && <div {...styles.header}>Header</div>;
        const elBacksideFooter = debug.footer && <div {...styles.footer}>Footer</div>;

        return (
          <Card
            {...props}
            header={elHeader}
            footer={elFooter}
            backside={elBackside}
            backsideHeader={elBacksideHeader}
            backsideFooter={elBacksideFooter}
            showBackside={{
              // NB: Typically this is a simple boolean that uses the default values.
              //     Shown here with the full configuration option.
              flipped: Boolean(props.showBackside),
              speed: debug.flipFast ? 300 : 1000,
            }}
            onClick={() => console.info('⚡️ onClick')}
            onFocusChange={
              !debug.focusable
                ? undefined
                : (e) => {
                    console.info('⚡️ onFocusChange', e);
                    state.change((d) => (d.props.focused = e.focused));
                  }
            }
          >
            {elBody}
          </Card>
        );
      });
  });

  e.it('init:keyboard', async (e) => {
    const dev = Dev.tools<T>(e, initial);
    const state = await dev.state();
    Keyboard.on({
      Enter(e) {
        e.handled();
        state.change((d) => Dev.toggle(d.props, 'showBackside'));
      },
    });
  });

  e.it('ui:debug', async (e) => {
    const dev = Dev.tools<T>(e, initial);

    dev.section('Properties', (dev) => {
      dev.boolean((btn) =>
        btn
          .label('userSelect')
          .value((e) => Boolean(e.state.props.userSelect))
          .onClick((e) => e.change((d) => Dev.toggle(d.props, 'userSelect'))),
      );

      dev.boolean((btn) =>
        btn
          .label('shadow')
          .value((e) => Boolean(e.state.props.shadow))
          .onClick((e) => e.change((d) => Dev.toggle(d.props, 'shadow'))),
      );

      dev.boolean((btn) =>
        btn
          .label('padding')
          .value((e) => Boolean(e.state.props.padding))
          .onClick((e) =>
            e.change(({ props }) => {
              props.padding = Boolean(props.padding) ? undefined : initial.props.padding;
            }),
          ),
      );

      dev.hr(-1, 5);

      dev.boolean((btn) =>
        btn
          .label('showAsCard')
          .value((e) => Boolean(e.state.props.showAsCard))
          .onClick((e) => e.change((d) => Dev.toggle(d.props, 'showAsCard'))),
      );
    });

    dev.hr(5, 20);

    dev.section('Background', (dev) => {
      dev.button('load background', async (e) => {
        // SAMPLE IMAGE OF: a subtle flowing background pattern.
        const url =
          'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1287&q=80';
        const host = e.ctx.toObject().props.host;
        const current = host.backgroundImage?.url;
        e.ctx.host.backgroundImage(current ? null : { url, opacity: 0.8 });
        e.label(current ? 'load background' : 'unload background');
      });

      dev.boolean((btn) =>
        btn
          .label('background.color (opacity: 0.5)')
          .value((e) => e.state.props.background?.color === 0.5)
          .onClick((e) =>
            e.change(({ props }) => {
              props.background = { ...Util.toBackground(props), color: e.current ? 1 : 0.5 };
            }),
          ),
      );

      dev.boolean((btn) =>
        btn
          .label('background.blur (4px)')
          .value((e) => e.state.props.background?.blur === 4)
          .onClick((e) =>
            e.change(({ props }) => {
              props.background = {
                ...Util.toBackground(props),
                blur: e.current ? undefined : 4,
              };
            }),
          ),
      );
    });

    dev.hr(5, 20);

    dev.section('Debug', (dev) => {
      dev.boolean((btn) =>
        btn
          .label((e) => `focusable`)
          .value((e) => Boolean(e.state.debug.focusable))
          .onClick((e) => e.change((d) => Dev.toggle(d.debug, 'focusable'))),
      );

      dev.hr(-1, 5);

      dev.boolean((btn) =>
        btn
          .label((e) => `flip speed: ${e.state.debug.flipFast ? 'fast' : 'slow'}`)
          .value((e) => e.state.debug.flipFast)
          .onClick((e) => e.change((d) => Dev.toggle(d.debug, 'flipFast'))),
      );

      dev.boolean((btn) =>
        btn
          .label((e) => 'showBackside (Enter)')
          .value((e) => Boolean(e.state.props.showBackside))
          .onClick((e) => e.change((d) => Dev.toggle(d.props, 'showBackside'))),
      );

      dev.hr(-1, 5);

      dev.boolean((btn) =>
        btn
          .label((e) => `header`)
          .value((e) => Boolean(e.state.debug.header))
          .onClick((e) => e.change((d) => Dev.toggle(d.debug, 'header'))),
      );

      dev.boolean((btn) =>
        btn
          .label((e) => `body`)
          .value((e) => Boolean(e.state.debug.body))
          .onClick((e) => e.change((d) => Dev.toggle(d.debug, 'body'))),
      );

      dev.boolean((btn) =>
        btn
          .label((e) => `footer`)
          .value((e) => Boolean(e.state.debug.footer))
          .onClick((e) => e.change((d) => Dev.toggle(d.debug, 'footer'))),
      );
    });
  });

  e.it('ui:footer', async (e) => {
    const dev = Dev.tools<T>(e, initial);
    dev.footer
      .border(-0.1)
      .render<T>((e) => <Dev.Object name={'Card'} data={e.state} expand={2} />);
  });
});

/**
 * [Helpers]
 */

const Util = {
  toBackground(props: t.CardProps) {
    return props.background || (props.background = {});
  },
};
