import { Dev, css } from '../../test.ui';
import { type TestCtx } from '../TestRunner/-dev/-types';

type T = { ctx: TestCtx };
const initial: T = {
  ctx: { fail: false, delay: 300 },
};

export default Dev.describe('BDD (TestRunner)', (e) => {
  e.it('ui:init', async (e) => {
    const ctx = Dev.ctx(e);

    ctx.subject
      .backgroundColor(1)
      .size([250, null])
      .display('grid')
      .render<T>((e) => {
        return <div {...css({ padding: 10, userSelect: 'none' })}>{`🐷`}</div>;
      });
  });

  e.it('ui:debug', async (e) => {
    const dev = Dev.tools<T>(e, initial);
    const state = await dev.state();

    dev.bdd((runner) =>
      runner
        .enabled(true)
        .localstore('dev:sys.common.TestRunner.BDD')
        .run({ label: 'Foobar', infoUrl: location.href, ctx: () => state.current.ctx })
        .modules(async () => {
          /**
           * NB: This example is intentionally more convoluted
           *     that it might normally be with an async import within an
           *     async function.
           *
           *     This is to simulate the async nature of some common
           *     usage scenarios.
           */
          const { TESTS } = await import('../TestRunner/-dev/-TESTS');
          return TESTS.all;
        })
        .onChanged((e) => {
          console.info(`⚡️ onChange:`, e);
        }),
    );
  });

  e.it('ui:footer', async (e) => {
    const dev = Dev.tools<T>(e, initial);
    dev.footer.border(-0.1).render<T>((e) => {
      const data = e.state;
      return <Dev.Object name={'BDD'} data={data} expand={1} />;
    });
  });
});
