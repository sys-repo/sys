import { TestPropList } from '..';
import { Util } from '../Test.PropList/u';
import { Dev, Time, expect, type t } from './-common';

export default Dev.describe('Controller Behavior', (e) => {
  e.it('init', async (e) => {
    const controller = await TestPropList.controller({});
    expect(controller.kind).to.eql('Test.PropList.Controller');
    expect(controller.suites).to.eql([]);
  });

  const import1 = import('./-TEST.sample-1');
  const import2 = import('./-TEST.sample-2');

  const expectOrder = (modules: t.TestSuiteModel[]) => {
    const labels = modules.map((suite) => suite.description);
    expect(labels[0]).to.eql('Sample-1');
    expect(labels[1]).to.eql('MySpec');
    expect(labels[2].startsWith('Sample-2: Lorem')).to.eql(true);
  };

  e.describe('load → all', (e) => {
    const modules = [import1, import2];

    e.it('[array]', async (e) => {
      const controller = await TestPropList.controller({ modules });
      expectOrder(controller.suites);
    });

    e.it('function', async (e) => {
      const controller = await TestPropList.controller({ modules: () => modules });
      expectOrder(controller.suites);
    });

    e.it('async function (simple)', async (e) => {
      const controller = await TestPropList.controller({ modules: async () => modules });
      expectOrder(controller.suites);
    });

    e.it('async function (wait)', async (e) => {
      const controller = await TestPropList.controller({
        async modules() {
          await Time.wait(10);
          return modules;
        },
      });
      expectOrder(controller.suites);
    });
  });

  e.describe('Util', (e) => {
    e.describe('importAndInitialize', (e) => {
      e.it('mixed: no initial title', async (e) => {
        const res = await Util.importAndInitialize({ modules: [import1, 'MyTitle', import2] });

        expect(res.length).to.eql(2);
        expect(res[0].title).to.eql('');
        expect(res[0].suites.map((e) => e.description)).to.eql(['Sample-1', 'MySpec']);

        expect(res[1].title).to.eql('MyTitle');
        expect(res[1].suites.length).to.eql(1);
        expect(res[1].suites[0].description.startsWith('Sample-2: Lorem')).to.eql(true);
      });

      e.it('mixed: initial title', async (e) => {
        const res = await Util.importAndInitialize({ modules: ['MyTitle', import1] });

        expect(res.length).to.eql(1);
        expect(res[0].title).to.eql('MyTitle');
        expect(res[0].suites.map((e) => e.description)).to.eql(['Sample-1', 'MySpec']);
      });
    });
  });
});

export const Foo = Dev.describe('Another specification');
