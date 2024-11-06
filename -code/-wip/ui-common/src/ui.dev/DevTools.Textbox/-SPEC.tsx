import { Textbox, TextboxProps } from '.';
import { Dev, DevIcons, type t } from '../../test.ui';

type StringOrNil = string | undefined | null;
type ErrorInput = t.DevTextboxError | boolean | undefined | null;

type T = {
  props: TextboxProps;
  debug: { edgeKind: 'JSX' | 'Boolean' };
};
const initial: T = {
  props: {
    isEnabled: Textbox.DEFAULT.isEnabled,
    label: 'My Label',
    value: 'Hello 👋',
    // placeholder: null,
  },
  debug: { edgeKind: 'Boolean' },
};

export default Dev.describe('Textbox', (e) => {
  e.it('init', async (e) => {
    const ctx = Dev.ctx(e);
    const state = await ctx.state<T>(initial);

    ctx.subject
      .display('grid')
      .size([250, null])
      .render<T>((e) => (
        <Textbox {...e.state.props} onChange={(e) => state.change((d) => (d.props.value = e.to))} />
      ));
  });

  e.it('ui:debug', async (e) => {
    const dev = Dev.tools<T>(e, initial);
    dev.footer
      .border(-0.1)
      .render<T>((e) => <Dev.Object name={'Dev.Textbox'} data={e.state} expand={1} />);

    dev.section('Value', (dev) => {
      const value = (value: StringOrNil, label?: string) => {
        dev.button((btn) =>
          btn
            .label((e) => label ?? `${value}`)
            .right((e) => (e.state.props.value === value ? '←' : ''))
            .onClick((e) => {
              e.change((d) => (d.props.value = value));
            }),
        );
      };

      value(undefined, 'clear (undefined)');
      dev.hr(-1, 5);
      value(null, 'null');
      value('', '"" (empty)');
      dev.hr(-1, 5);
      value('Hello 👋');
      value(Dev.Lorem.words(50), 'long (50 words)');
    });

    dev.hr(5, 20);

    dev.section('Debug', (dev) => {
      dev.boolean((btn) =>
        btn
          .label('enabled')
          .value((e) => e.state.props.isEnabled)
          .onClick((e) => e.change((d) => Dev.toggle(d.props, 'isEnabled'))),
      );

      dev.boolean((btn) =>
        btn
          .label('label')
          .value((e) => Boolean(e.state.props.label))
          .onClick((e) =>
            e.change((d) => {
              d.props.label = d.props.label ? undefined : 'My Label';
            }),
          ),
      );

      dev.boolean((btn) =>
        btn
          .label((e) =>
            e.state.props.placeholder === null ? 'placeholder: null' : 'placeholder (default)',
          )
          .value((e) => e.state.props.placeholder !== null)
          .onClick((e) =>
            e.change((d) => {
              const next = d.props.placeholder === null ? undefined : null;
              d.props.placeholder = next;
            }),
          ),
      );

      dev.boolean((btn) =>
        btn
          .label((e) => 'margin')
          .value((e) => Boolean(e.state.props.margin))
          .onClick((e) =>
            e.change((d) => {
              d.props.margin = d.props.margin ? null : [10, 20, 30, 50];
            }),
          ),
      );

      dev.hr(-1, 5);

      dev.section((dev) => {
        const isJSX = (state: T) => state.debug.edgeKind === 'JSX';
        const elIcon = <DevIcons.Keyboard style={{ MarginX: 3 }} color={'rgba(255, 0, 0, 0.5)'} />;

        dev.boolean((btn) =>
          btn
            .label((e) => `value kind: ${e.state.debug.edgeKind === 'JSX' ? 'JSX' : 'Boolean'}`)
            .value((e) => Boolean(e.state.debug.edgeKind === 'JSX'))
            .onClick((e) => {
              e.change((d) => {
                const kind = d.debug.edgeKind === 'JSX' ? 'Boolean' : 'JSX';
                d.debug.edgeKind = kind;
                if (kind === 'JSX') {
                  if (d.props.left === true) d.props.left = elIcon;
                  if (d.props.right === true) d.props.right = elIcon;
                }
                if (kind === 'Boolean') {
                  if (typeof d.props.left === 'object') d.props.left = true;
                  if (typeof d.props.right === 'object') d.props.right = true;
                }
              });
            }),
        );

        const edge = (field: keyof Pick<TextboxProps, 'left' | 'right'>) => {
          dev.boolean((btn) =>
            btn
              .label((e) => `${field} ← (${isJSX(e.state) ? 'JSX' : 'Boolean'})`)
              .value((e) => Boolean(e.state.props[field]))
              .onClick((e) =>
                e.change((d) => {
                  const value = isJSX(d) ? elIcon : true;
                  d.props[field] = d.props[field] ? undefined : value;
                }),
              ),
          );
        };

        edge('left');
        edge('right');
      });

      dev.hr(-1, 5);

      const error = (value: ErrorInput) => {
        dev.button((btn) =>
          btn
            .label(`error: ${value}`)
            .right((e) => (e.state.props.right === value ? '←' : ''))
            .onClick((e) => e.change((d) => (d.props.error = value))),
        );
      };
      error('error');
      error('warning');
      error(true);
      error(undefined);
    });

    dev.hr(5, 20);

    dev.textbox((txt) =>
      txt
        .enabled((e) => e.state.props.isEnabled)
        .label((e) => e.state.props.label)
        .placeholder((e) => e.state.props.placeholder)
        .left((e) => e.state.props.left)
        .right((e) => e.state.props.right)
        .value((e) => e.state.props.value)
        .margin((e) => e.state.props.margin)
        .focus({ onReady: true, action: 'Cursor:End' })
        .error((e) => e.state.props.error)
        .footer((e) =>
          e.state.props.value
            ? 'Commentary on the input value.'
            : 'Here is a hint about what to enter.',
        )
        .onChange((e) => {
          e.change((d) => (d.props.value = e.to.value));
          console.info('⚡️ onChange', e.to);
        })
        .onEnter((e) => {
          console.info('⚡️ onEnter', e);
        }),
    );
  });
});
