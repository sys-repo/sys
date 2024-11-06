import { type TestPropListProps } from '../Test.PropList';
import { Dev, Pkg, type TestCtx } from './-common';

const PropList = Dev.TestRunner.PropList;
const DEFAULTS = PropList.DEFAULTS;

type P = TestPropListProps;
type T = {
  ctx: TestCtx;
  props: P;
  debug: {
    label?: string;
    infoUrl?: boolean;
    ellipsis?: boolean;
    selectable?: boolean;
  };
};
const initial: T = {
  ctx: { fail: false, delay: 300 },
  props: {},
  debug: {},
};

export default Dev.describe('TestRunner.PropList', (e) => {
  type LocalStore = Pick<P, 'fields' | 'enabled' | 'theme'> &
    T['debug'] & { selected: string[]; delay: number; fail: boolean };
  const localstore = Dev.LocalStorage<LocalStore>('dev:sys.common.TestRunner.PropList');
  const local = localstore.object({
    fields: DEFAULTS.fields.default,
    infoUrl: true,
    ellipsis: false,
    enabled: true,
    theme: undefined,
    selected: [],
    selectable: true,
    label: '',
    delay: initial.ctx.delay,
    fail: initial.ctx.fail,
  });

  e.it('ui:init', async (e) => {
    const ctx = Dev.ctx(e);
    const state = await ctx.state<T>(initial);

    await state.change((d) => {
      d.debug.infoUrl = local.infoUrl;
      d.debug.ellipsis = local.ellipsis;
      d.debug.label = local.label;
      d.debug.selectable = local.selectable;

      d.props.fields = local.fields;
      d.props.enabled = local.enabled;
      d.props.theme = local.theme;

      d.ctx.delay = local.delay;
      d.ctx.fail = local.fail;
    });

    const infoUrl = '?dev=sys.ui.dev.TestRunner.PropList';
    const controller = await Dev.TestRunner.PropList.controller({
      /**
       * Initial state (passed into Controller).
       */
      pkg: Pkg,
      async modules() {
        // NB: function or array (optionally async).
        return [
          import('./-TEST.sample-1'),
          import('./-TEST.sample-2'),
          'Internal',
          import('./-TEST.controller'),
        ];
      },
      run: {
        ctx: () => state.current.ctx,
        // button: 'hidden',
        label: () => state.current.debug.label || undefined,
        infoUrl: () => (state.current.debug.infoUrl ? infoUrl : undefined),
        onRunSingle: (e) => console.info('⚡️ onRunSingle:', e),
        onRunAll: (e) => console.info('⚡️ onRunAll:', e),
      },
      specs: {
        selected: local.selected,
        selectable: () => state.current.debug.selectable,
        ellipsis: () => state.current.debug.ellipsis,
        onSelect: (e) => console.info('⚡️ onChange:', e),
      },
      keyboard: {
        run: () => 'Enter',
        runAll: () => 'ALT + Enter',
        selectAll: 'ALT + KeyA',
        selectNone: 'ALT + SHIFT + KeyA',
      },
    });

    const updateData = () => state.change((d) => (d.props.data = controller.current));
    updateData();
    controller.$.subscribe((e) => {
      updateData();
      local.selected = e.selected;
    });

    ctx.host.tracelineColor(-0.05);
    ctx.debug.width(300);
    ctx.subject
      .size([330, null])
      .display('grid')
      .render<T>((e) => {
        const { props } = e.state;
        Dev.Theme.background(ctx, props.theme, 1);
        return <Dev.TestRunner.PropList {...props} />;
      });
  });

  e.it('ui:debug', async (e) => {
    const dev = Dev.tools<T>(e, initial);
    const state = await dev.state();

    dev.section('FieldSelector', (dev) => {
      dev.row((e) => {
        return (
          <Dev.TestRunner.PropList.FieldSelector
            selected={e.state.props.fields}
            onClick={(ev) => {
              dev.change((d) => (local.fields = d.props.fields = ev.next()));
            }}
          />
        );
      });
    });

    dev.hr(5, [10, 20]);

    dev.section('Options', (dev) => {
      dev.textbox((txt) =>
        txt
          .left(true)
          .margin([0, 0, 5, 0])
          .placeholder('title (run)')
          .value((e) => e.state.debug.label)
          .onChange((e) => e.change((d) => (local.label = d.debug.label = e.to.value))),
      );

      dev.boolean((btn) =>
        btn
          .label((e) => `infoUrl ← (${e.state.debug.infoUrl ? 'showing' : 'hidden'})`)
          .value((e) => e.state.debug.infoUrl)
          .onClick((e) => e.change((d) => (local.infoUrl = Dev.toggle(d.debug, 'infoUrl')))),
      );

      dev.boolean((btn) =>
        btn
          .label((e) => `ellipsis`)
          .value((e) => Boolean(e.state.debug.ellipsis))
          .onClick((e) => e.change((d) => (local.ellipsis = Dev.toggle(d.debug, 'ellipsis')))),
      );

      dev.boolean((btn) =>
        btn
          .label((e) => `selectable`)
          .value((e) => e.state.debug.selectable)
          .onClick((e) => e.change((d) => (local.selectable = Dev.toggle(d.debug, 'selectable')))),
      );
    });

    dev.hr(5, 20);

    dev.section('Properties', (dev) => {
      Dev.Theme.switcher(
        dev,
        (d) => d.props.theme,
        (d, value) => (local.theme = d.props.theme = value),
      );

      dev.boolean((btn) =>
        btn
          .label((e) => `enabled`)
          .value((e) => e.state.props.enabled)
          .onClick((e) => e.change((d) => (local.enabled = Dev.toggle(d.props, 'enabled')))),
      );
    });

    dev.hr(5, 20);

    dev.section('Debug', (dev) => {
      dev.button('redraw', () => dev.redraw());

      dev.boolean((btn) =>
        btn
          .label((e) => `ctx.fail = ${e.state.ctx.fail}`)
          .value((e) => e.state.ctx.fail)
          .onClick((e) => e.change((d) => (local.fail = Dev.toggle(d.ctx, 'fail')))),
      );

      dev.boolean((btn) =>
        btn
          .label((e) => `ctx.delay = ${e.state.ctx.delay}ms`)
          .value((e) => e.state.ctx.delay === initial.ctx.delay)
          .onClick((e) => {
            e.change((d) => {
              const defaultDelay = initial.ctx.delay;
              const next = d.ctx.delay === defaultDelay ? 1500 : defaultDelay;
              local.delay = d.ctx.delay = next;
            });
          }),
      );
    });
  });

  e.it('ui:footer', async (e) => {
    const dev = Dev.tools<T>(e, initial);
    dev.footer.border(-0.1).render<T>((e) => {
      const data = {
        ...e.state,
        'props.data.specs': e.state.props.data?.specs,
        'props.data.specs.results': e.state.props.data?.specs?.results,
      };
      return <Dev.Object name={'TestRunner.PropList'} data={data} expand={1} />;
    });
  });
});
