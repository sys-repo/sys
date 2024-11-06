import { Dev, pkg, type t } from './mod.ts';

type T = { spinning?: boolean; results?: t.TestSuiteRunResponse[] };
const initial: T = {};

export default Dev.describe('TestRunner', (e) => {
  e.it('init', async (e) => {
    const ctx = Dev.ctx(e);
    await ctx.state<T>(initial);

    ctx.debug.width(300);
    ctx.subject
      .backgroundColor(1)
      .size('fill')
      .render<T>((e) => {
        const { spinning, results } = e.state;
        return (
          <Dev.TestRunner.Results
            style={{ Absolute: 0 }}
            data={results}
            spinning={spinning}
            scroll={true}
          />
        );
      });
  });

  e.it('ui:debug', async (e) => {
    const dev = Dev.tools<T>(e, initial);
    const state = await dev.state();

    dev.bdd((runner) =>
      runner
        .run({})
        .modules(async () => (await import('./-TestRunner.TESTS.ts')).TESTS.all)
        .localstore(`dev:${pkg.name}`)
        .keyboard(true)
        .onChanged((e) => state.change((d) => (d.results = e.results))),
    );
  });

  e.it('ui:footer', (e) => {
    const dev = Dev.tools<T>(e, initial);
    dev.footer.border(-0.1).render<T>((e) => {
      const data = { Results: e.state.results };
      return <Dev.Object name={'TestRunner'} data={data} expand={1} />;
    });
  });
});
