import { Cmd, Time, describe, expect, it, type t } from '../../-test.ts';
import { Doc, Store } from '../mod.ts';

import { Tests, type C } from '@sys/cmd/testing';

const setup: t.CmdTestSetup = async () => {
  const store = Store.init();
  const { dispose$ } = store;
  const dispose = () => store.dispose();
  const factory: t.CmdTestFactory = () => store.doc.getOrCreate((d) => d);
  const res: t.CmdTestState = { doc: await factory(), factory, dispose, dispose$ };
  return res;
};

describe(
  'crdt.cmd (Command)',

  /**
   * NOTE: The upstream [automerge-repo] library leaks timers.
   *       Waiting on this final test, with [sanitizeOps:false] prevents
   *       the entire suite failing because of these leaked timers.
   */
  { sanitizeResources: false, sanitizeOps: false },

  () => {
    /**
     * Standardised test suite for the <Cmd> system.
     */
    Tests.all(setup, { describe, it, expect });

    /**
     * CRDT/Lens specific tests.
     */
    describe('Lens (Command)', () => {
      it('has initial {cmd} structure upon creation', async () => {
        const { doc, dispose } = await setup();
        const lens = Doc.lens(doc as t.Doc, ['foo', 'bar'], (d) => (d.foo = { bar: {} }));

        expect(Cmd.Is.state.cmd(doc.current)).to.eql(false);
        expect(Cmd.Is.state.cmd(lens.current)).to.eql(false);

        Cmd.create(doc);
        expect(Cmd.Is.state.cmd(doc.current)).to.eql(true);
        expect(Cmd.Is.state.cmd(lens.current)).to.eql(false);

        Cmd.create(lens);

        expect(Cmd.Is.state.cmd(lens.current)).to.eql(true);
        expect(Cmd.Is.state.cmd((doc.current as any).foo.bar)).to.eql(true);

        dispose();
      });

      it('⚡️← on lens', async () => {
        const { doc, dispose, dispose$ } = await setup();
        const lens = Doc.lens(doc as t.Doc, ['foo'], (d) => (d.foo = {}));
        expect(doc.current).to.eql({ foo: {} });

        const cmd = Cmd.create<C>(lens);
        const fired: t.CmdTx[] = [];
        cmd.events(dispose$).tx$.subscribe((e) => fired.push(e));

        const tx = 'tx.foo';
        cmd.invoke('Bar', { msg: 'hello' }, { tx });

        await Time.wait(0);
        expect(fired.length).to.eql(1);

        const queue = (doc.current as any).foo.queue as t.CmdQueue;
        expect(queue.length).to.eql(1);
        expect(queue[0].name).to.eql('Bar');
        expect(queue[0].params).to.eql({ msg: 'hello' });
        expect(queue[0].tx).to.eql(tx);

        dispose();
      });
    });
  },
);
