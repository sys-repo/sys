import { Dev, type TestCtx } from './-common';
import suite1 from './-TEST.sample-1';
import suite2 from './-TEST.sample-2';

import { type TestResultsProps } from '../Test.Results';

type T = {
  ctx: TestCtx;
  props: TestResultsProps;
  debug: { noop: boolean };
};
const initial: T = {
  ctx: { fail: false, delay: 300 },
  props: { spinning: false, scroll: true },
  debug: { noop: false },
};

export default Dev.describe('TestRunner', (e) => {
  type LocalStore = TestCtx & T['debug'] & Pick<TestResultsProps, 'theme'>;
  const localstore = Dev.LocalStorage<LocalStore>('dev:sys.common.TestRunner.Results');
  const local = localstore.object({
    theme: undefined,
    fail: initial.ctx.fail,
    delay: initial.ctx.delay,
    noop: initial.debug.noop,
  });

  e.it('init', async (e) => {
    const ctx = Dev.ctx(e);
    const state = await ctx.state<T>(initial);

    await state.change((d) => {
      d.props.theme = local.theme;
      d.ctx.fail = local.fail;
      d.ctx.delay = local.delay;
      d.debug.noop = local.noop;
    });

    ctx.subject
      .display('grid')
      .size('fill')
      .render<T>((e) => {
        const { props } = e.state;
        Dev.Theme.background(ctx, props.theme, 1);
        return <Dev.TestRunner.Results {...props} />;
      });
  });

  e.it('ui:debug.PropList', async (e) => {
    const dev = Dev.tools<T>(e, initial);
    const state = await dev.state();

    dev.bdd((runner) =>
      runner
        .localstore('dev:sys.common.TestRunner.Results')
        .margin([20, 35, 0, 30])
        .run({ ctx: () => state.current.ctx })
        .keyboard(true)
        .modules(async () => {
          /**
           * NB: This is more convoluted that it might normally be
           *     with an async import within an async function.
           *     This is to simulate the async nature of some use-cases.
           */
          const { TESTS } = await import('./-TESTS');
          return TESTS.all;
        })
        .onChanged(async (e) => {
          await state.change((d) => (d.props.data = e.results));
        }),
    );

    dev.hr(5, 20);
  });

  e.it('ui:debug', async (e) => {
    const dev = Dev.tools<T>(e, initial);

    dev.section('Runner', (dev) => {
      dev.button('clear', (e) => e.change((d) => (d.props.data = undefined)));

      dev.boolean((btn) =>
        btn
          .label((e) => `ctx.fail = ${e.state.ctx.fail}`)
          .value((e) => e.state.ctx.fail)
          .onClick((e) => e.change((d) => (local.fail = Dev.toggle(d.ctx, 'fail')))),
      );

      dev.boolean((btn) =>
        btn
          .label((e) => `run({ noop: ${e.state.debug.noop} })`)
          .value((e) => e.state.debug.noop)
          .onClick((e) => e.change((d) => (local.noop = Dev.toggle(d.debug, 'noop')))),
      );

      dev.hr(-1, 5);

      dev.button('run: sample', async (e) => {
        const { ctx, debug } = e.state.current;
        const noop = debug.noop;
        const results = await suite1.run({ ctx, noop });
        await e.change((d) => (d.props.data = results));
      });

      dev.button((btn) =>
        btn
          .label('run: long, overflowing')
          .right('← scollable')
          .onClick(async (e) => {
            const ctx = e.state.current.ctx;
            const results = await suite2.run({ ctx });
            await e.change((d) => (d.props.data = results));
          }),
      );
    });

    dev.hr(5, 20);

    dev.section('Properties', (dev) => {
      dev.boolean((btn) =>
        btn
          .label('spinning')
          .value((e) => e.state.props.spinning)
          .onClick((e) => e.change((d) => Dev.toggle(d.props, 'spinning'))),
      );

      dev.boolean((btn) =>
        btn
          .label('scroll')
          .value((e) => e.state.props.scroll)
          .onClick((e) => e.change((d) => Dev.toggle(d.props, 'scroll'))),
      );

      Dev.Theme.switcher(
        dev,
        (d) => d.props.theme,
        (d, value) => (local.theme = d.props.theme = value),
      );
    });
  });
});
