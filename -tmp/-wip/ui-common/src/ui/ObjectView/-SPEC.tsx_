import { ObjectView } from '.';
import { Dev, Value, type t } from '../../test.ui';

type T = t.ObjectViewProps;

const length = Value.random(5000, 15000);
const binary = new Uint8Array(new Array(length).fill(0));

const initial: T = {
  name: 'Foo',
  data: { msg: '👋', list: [1, [{ msg: 'two' }], 'three'], count: 123, foo: false, binary },
};

export default Dev.describe('ObjectView', (e) => {
  e.it('init', async (e) => {
    const ctx = Dev.ctx(e);
    ctx.subject.size([350, null]).render<T>((e) => {
      const props = e.state;
      return <ObjectView {...props} />;
    });
  });

  e.it('ui:debug', async (e) => {
    const dev = Dev.tools<T>(e, initial);

    dev.section('Properties', (dev) => {
      dev.boolean((btn) =>
        btn
          .label('showNonenumerable')
          .value((e) => e.state.showNonenumerable ?? ObjectView.DEFAULTS.showNonenumerable)
          .onClick((e) => e.change((d) => Dev.toggle(d, 'showNonenumerable'))),
      );

      dev.boolean((btn) =>
        btn
          .label('showRootSummary')
          .value((e) => e.state.showRootSummary ?? ObjectView.DEFAULTS.showRootSummary)
          .onClick((e) => e.change((d) => Dev.toggle(d, 'showRootSummary'))),
      );
    });

    dev.hr(5, 20);

    dev.section('Configurations', (e) => {
      dev.boolean((btn) =>
        btn
          .label((e) => `theme: ${e.state.theme ?? ObjectView.DEFAULTS.theme}`)
          .value((e) => Boolean(e.state.theme))
          .onClick((e) => {
            const current = e.state.current.theme ?? ObjectView.DEFAULTS.theme;
            const next = current === 'Dark' ? 'Light' : 'Dark';
            e.change((draft) => (draft.theme = next));
            Dev.Theme.background(dev.ctx, next);
          }),
      );

      dev.hr(-1, 5);

      dev.boolean((btn) =>
        btn
          .label('name')
          .value((e) => Boolean(e.state.name))
          .onClick((e) => {
            const next = e.state.current.name ? undefined : initial.name;
            e.change((d) => (d.name = next));
          }),
      );

      dev.boolean((btn) =>
        btn
          .label(
            (e) =>
              `fontSize: ${
                Boolean(e.state.fontSize)
                  ? `(larger, ${e.state.fontSize}px)`
                  : `(default, ${ObjectView.DEFAULTS.font.size}px)`
              }`,
          )
          .value((e) => Boolean(e.state.fontSize))
          .onClick((e) => {
            e.change((d) => {
              d.fontSize = d.fontSize ? undefined : (d.fontSize = 18);
            });
          }),
      );

      dev.hr(-1, 5);

      const expand = (label: string, value?: number) => {
        dev.button((btn) => {
          btn.label(label).onClick((e) => e.change((e) => (e.expand = value)));
        });
      };

      expand('expand = `1`', 1);
      expand('expand = `99`', 99);
      expand('expand = `undefined`', undefined);

      dev.hr();

      dev
        .button((btn) => {
          btn.label('expand = 99').onClick((e) => e.change((e) => (e.expand = 99)));
        })
        .button((btn) => {
          btn.label('expand = 1').onClick((e) => e.change((e) => (e.expand = 1)));
        });
    });

    dev.hr(5, 20);

    dev.section('Data (← JSON)', (dev) => {
      const value = (label: string, data: any, right?: string) => {
        dev.button((btn) =>
          btn
            .label(label)
            .right(right ?? '')
            .onClick((e) => e.change((d) => (d.data = data))),
        );
      };
      value('`undefined`', undefined);
      value('`null`', null);
      dev.hr();
      value('`true`', true, '← boolean');
      value('`123`', 123, '← number');
      value('`"Hello"`', 'Hello', '← string');
      dev.hr();
      value('`{object}`', initial.data);
      value('`{ }`', {}, '(empty)');
      dev.hr();
      value('`[array]`', [1, 'two', { id: 'three' }, [true, 'four', () => null]]);
      value('`[ ]`', [], '(empty)');
    });

    dev.hr();
  });
});
