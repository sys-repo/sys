import { PropList } from '..';
import { Dev, Immutable, Json, css, rx, type t } from '../../../test.ui';
import { Wrangle } from '../u';
import { BuilderSample } from './-SPEC.ui.Builder';
import { sampleItems } from './-SPEC.ui.sample';
import { DEFAULTS, SampleFields, type MyField } from './common';

type SampleKind = 'Empty' | 'One Item' | 'Two Items' | 'Samples' | 'Builder';
type P = t.PropListProps;
type D = {
  source: SampleKind;
  fields?: MyField[];
  header: boolean;
  footer: boolean;
};

const name = DEFAULTS.displayName;

export default Dev.describe(name, (e) => {
  type LocalStore = { props?: string; debug?: string };
  const localstore = Dev.LocalStorage<LocalStore>(`dev:${name}`);
  const local = localstore.object({ props: undefined, debug: undefined });
  const State = {
    props: Immutable.clonerRef<P>(
      Json.parse<P>(local.props, { title: 'MyTitle', defaults: {}, theme: 'Light', enabled: true }),
    ),
    debug: Immutable.clonerRef<D>(
      Json.parse<D>(local.debug, { source: 'Samples', header: true, footer: true }),
    ),
  } as const;

  e.it('init', async (e) => {
    const ctx = Dev.ctx(e);

    const props$ = State.props.events().changed$;
    const debug$ = State.debug.events().changed$;
    rx.merge(props$, debug$)
      .pipe(rx.debounceTime(1000))
      .subscribe(() => {
        local.props = Json.stringify(State.props.current);
        local.debug = Json.stringify(State.debug.current);
      });
    rx.merge(props$, debug$)
      .pipe(rx.debounceTime(100))
      .subscribe(() => ctx.redraw());

    Util.setSample(State.debug.current.source);

    ctx.debug.width(330);
    ctx.subject
      .display('grid')
      .size([250, null])
      .render<D>(() => {
        const props = State.props.current;
        Dev.Theme.background(ctx, props.theme, 1);
        return <PropList {...props} />;
      });
  });

  e.it('ui:debug', async (e) => {
    const dev = Dev.tools<D>(e);

    dev.section('Properties', (dev) => {
      Dev.Theme.immutable(dev, State.props, 1);

      dev.boolean((btn) => {
        const state = State.props;
        const current = () => !!state.current.enabled;
        btn
          .label(() => `enabled`)
          .value(() => current())
          .onClick(() => state.change((d) => Dev.toggle(d, 'enabled')));
      });

      dev.boolean((btn) => {
        const state = State.props;
        const current = () => !!state.current.loading;
        btn
          .label(() => `loading`)
          .value(() => current())
          .onClick(() => state.change((d) => Dev.toggle(d, 'loading')));
      });

      dev.hr(-1, 5);

      dev.boolean((btn) => {
        const state = State.props;
        const current = () => !!state.current.defaults?.monospace;
        btn
          .label(() => `defaults.monospace`)
          .value(() => current())
          .onClick(() => state.change((d) => Dev.toggle(Util.defaults(d), 'monospace')));
      });

      dev.hr(5, 20);
    });

    dev.section('Title', (dev) => {
      const Title = {
        get current() {
          return Wrangle.title(State.props.current.title);
        },
        obj(props: P): t.PropListTitle {
          const current = props.title;
          if (typeof current === 'object' && current !== null) return current as t.PropListTitle;
          return (props.title = {});
        },
      } as const;

      const lorem = Dev.Lorem.words(50);
      const titleButton = (label: string, value: t.PropListTitle['value']) => {
        dev.button(`set: ${label}`, () => {
          State.props.change((d) => (Title.obj(d).value = value));
        });
      };

      titleButton('none (undefined)', undefined);
      dev.hr(-1, 5);
      titleButton('"MyTitle"', 'MyTitle');
      titleButton('long (50 words)', lorem);
      const elTitle = <div {...css({ fontSize: 32 })}>{'🐷'}</div>;
      titleButton('<Element>', elTitle);
      titleButton('[<Element>, <Element>]', [elTitle, elTitle]);
      dev.hr(-1, 5);
      titleButton('[ "Left", "Right" ]', ['Left', 'Right']);
      titleButton('[ (long), "Right" ]', [lorem, 'Right']);
      titleButton('[ "Left", (long) ]', ['Left', lorem]);
      titleButton('[ (long), (long) ]', [lorem, lorem]);

      dev.hr(1, 12);

      dev.boolean((btn) =>
        btn
          .label(() => `ellipsis: ${!!Title.current.ellipsis}`)
          .value(() => Title.current.ellipsis)
          .onClick(() => State.props.change((d) => Dev.toggle(Title.obj(d), 'ellipsis'))),
      );

      dev.boolean((btn) =>
        btn
          .label(() => `margin: ${Title.current.margin || '(default)'}`)
          .value(() => !!Title.current.margin)
          .onClick(() => {
            State.props.change((d) => {
              const title = Title.obj(d);
              title.margin = title.margin ? undefined : [30, 50];
            });
          }),
      );
    });

    dev.hr(5, 20);

    dev.section('Items', (dev) => {
      const button = (kind: SampleKind) => {
        dev.button(kind, () => Util.setSample(kind));
      };
      button('Empty');
      dev.hr(-1, 5);
      button('Samples');
      button('One Item');
      button('Two Items');
      dev.hr(-1, 5);
      button('Builder');
    });

    dev.section((dev) => {
      dev.row(() => {
        const debug = State.debug.current;
        const props: t.PropListFieldSelectorProps<MyField> = {
          title: 'Field Selector',
          all: SampleFields.all,
          selected: debug.fields,
          onClick(e) {
            const fields = e.next(SampleFields.defaults);
            State.debug.change((d) => (d.fields = fields));
            Util.setSample('Builder');
          },
        };
        return (
          <PropList.FieldSelector
            //
            {...props}
            style={{ Margin: [20, 0, 20, 30] }}
          />
        );
      });
    });
  });

  e.it('ui:footer', async (e) => {
    const dev = Dev.tools<D>(e);

    dev.footer.border(-0.1).render<D>((e) => {
      const props = State.props.current;
      const data = { props };
      return <Dev.Object name={name} data={data} expand={1} fontSize={11} />;
    });
  });

  const Util = {
    setSample(source: SampleKind) {
      State.debug.change((d) => (d.source = source));
      State.props.change((d) => (d.items = Util.toItems(State.debug.current)));
    },

    toItems(debug: D) {
      const { source, fields } = debug;
      if (source === 'Empty') return [];
      if (source === 'Samples') return sampleItems;
      if (source === 'One Item') return [{ label: 'hello', value: 'py.123' }];
      if (source === 'Two Items')
        return [
          { label: 'one', value: '123' },
          { label: 'two', value: '456' },
        ];
      if (source === 'Builder') return BuilderSample.toItems({ fields });
      return [];
    },

    defaults(props: t.PropListProps) {
      return props.defaults ?? (props.defaults = {});
    },
  } as const;
});
