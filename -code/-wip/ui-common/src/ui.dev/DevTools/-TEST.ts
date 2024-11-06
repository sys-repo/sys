import type { t } from '../common.ts';

import { Dev, Test, expect, rx } from '../../test.ui/mod.ts';
import { DevTools } from '../DevTools/mod.ts';

export default Test.describe('DevTools', (e) => {
  const bus = rx.bus();
  const instance: t.DevInstance = { bus, id: 'foo' };

  const setup = async () => {
    const events = Dev.Bus.Controller({ instance });
    const { ctx } = await Dev.Context.init(instance);
    return { events, ctx, dispose: () => events.dispose() } as const;
  };

  e.describe('Is', (e) => {
    const Is = DevTools.Is;

    e.it('Is.ctx ← DevCtx', async (e) => {
      const { ctx, dispose } = await setup();
      const non = [null, undefined, '', 123, true, [], {}];
      non.forEach((v) => expect(Is.ctx(v)).to.eql(false));
      expect(Is.ctx(ctx)).to.eql(true);
      dispose();
    });

    e.it('Is.dev ← DevTools', async (e) => {
      type T = { count: number };
      const { ctx, dispose } = await setup();
      const dev = DevTools.init<T>(ctx, { count: 123 });

      const non = [null, undefined, '', 123, true, [], {}];
      non.forEach((v) => expect(Is.dev(v)).to.eql(false));

      const sample = Is.dev(dev as any) ? dev : undefined; // NB: assigned [sample] is typed <T>.
      expect(Is.dev(dev)).to.eql(true);
      expect(Is.dev(sample)).to.eql(true);
      dispose();
    });
  });

  e.describe('Wrangle', (e) => {
    const Wrangle = DevTools.Wrangle;

    e.it('Wrangle.ctx', async (e) => {
      type T = { count: number };
      const { ctx, dispose } = await setup();
      const dev = DevTools.init<T>(ctx, { count: 123 });

      expect(Wrangle.ctx(dev)).to.equal(ctx);
      expect(Wrangle.ctx(ctx)).to.equal(ctx);

      const non = [null, undefined, '', 123, true, [], {}];
      non.forEach((v: any) => expect(Wrangle.ctx(v)).to.eql(undefined));

      dispose();
    });
  });
});
