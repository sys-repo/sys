import { Cmd } from '../mod.ts';
import { Time, type t } from './common.ts';
import { Find } from './u.ts';

import type { C, C1 } from './t.ts';
const DEFAULTS = Cmd.DEFAULTS;

export function cmdTests(setup: t.CmdTestSetup, args: t.TestArgs) {
  const { describe, it, expect } = args;
  const log = Cmd.DEFAULTS.log();

  describe('Cmd', () => {
    it('Cmd.DEFAULTS', () => {
      expect(Cmd.DEFAULTS).to.eql(DEFAULTS);
    });

    it('Cmd.DEFAULTS.error', () => {
      const error: t.ErrorLike = { message: '🍌' };
      expect(DEFAULTS.error('🍌')).to.eql(error);
    });

    it('create ← {paths} param {object} variant', async () => {
      const { factory, dispose } = await setup();
      const paths: t.CmdPaths = {
        queue: ['x', 'q'],
        log: ['t', 'a'],
      };

      const doc1 = await factory();
      const doc2 = await factory();
      const doc3 = await factory();

      const cmd1 = Cmd.create<C>(doc1);
      const cmd2 = Cmd.create<C>(doc2, { paths });
      const cmd3 = Cmd.create<C>(doc3, paths);

      const tx = 'my-tx';
      const e = DEFAULTS.error('404');
      cmd1.invoke('Foo', { foo: 888 }, tx);
      cmd2.invoke('Bar', {}, { tx, error: e }); // NB: as full {options} object.
      cmd3.invoke('Bar', { msg: '👋' }, tx);
      await Time.wait(0);

      expect(doc1.current).to.eql({
        log,
        queue: [{ name: 'Foo', params: { foo: 888 }, tx, id: Find.queueId(doc1, 0) }],
      });

      expect(doc2.current).to.eql({
        x: { q: [{ name: 'Bar', params: {}, error: e, tx, id: Find.queueId(doc2, 0, paths) }] },
        t: { a: log },
      });

      expect(doc3.current).to.eql({
        x: { q: [{ name: 'Bar', params: { msg: '👋' }, tx, id: Find.queueId(doc3, 0, paths) }] },
        t: { a: log },
      });

      dispose();
    });

    it('create ← {paths} as [path] prefix', async () => {
      const { factory, dispose } = await setup();
      const doc = await factory();
      const cmd = Cmd.create<C>(doc, { paths: ['foo'] });
      const paths = Cmd.toPaths(cmd);
      const tx = 'my-tx';

      cmd.invoke('Foo', { foo: 888 }, tx);
      await Time.wait(0);

      const id = Find.queueId(doc, 0, paths);
      expect(doc.current).to.eql({
        foo: {
          log,
          queue: [{ name: 'Foo', params: { foo: 888 }, tx, id }],
        },
      });

      dispose();
    });

    it('has initial {cmd} structure upon creation', async () => {
      const { doc, dispose } = await setup();
      expect(Cmd.Is.state.cmd(doc.current)).to.eql(false);

      Cmd.create(doc);
      expect(Cmd.Is.state.cmd(doc.current)).to.eql(true);

      dispose();
    });

    const length = 100;
    it(`${length}x invocations ← order retained`, async () => {
      const { doc, dispose, dispose$ } = await setup();
      const cmd = Cmd.create<C>(doc);

      const fired: t.CmdTx<C1>[] = [];
      cmd
        .events(dispose$)
        .on('Foo')
        .subscribe((e) => fired.push(e));

      Array.from({ length }).forEach((_, i) => cmd.invoke('Foo', { foo: i + 1 }));

      await Time.wait(0);
      expect(fired.length).to.eql(length);
      expect(fired[length - 1].params.foo).to.eql(length);
      dispose();
    });

    it('invoke with {issuer} ← identity', async () => {
      const { doc, dispose, dispose$ } = await setup();
      const issuer = 'mary';
      const cmd = Cmd.create<C>(doc, { issuer });
      const paths = Cmd.toPaths(cmd);

      const fired: t.CmdTx<C1>[] = [];
      cmd
        .events(dispose$)
        .on('Foo')
        .subscribe((e) => fired.push(e));

      cmd.invoke('Foo', { foo: 123 });
      await Time.wait(0);

      const queue = Cmd.Path.resolver(paths).queue.list(doc.current);
      expect(queue[0].issuer).to.eql(issuer);
      expect(fired[0].issuer).to.eql(issuer);

      dispose();
    });

    describe('Hidden fields', () => {
      const NON = [null, undefined, {}, [], true, 123, Symbol('foo'), BigInt(0)];

      it('Cmd.toTransport', async () => {
        const { doc, dispose } = await setup();
        const cmd = Cmd.create<C>(doc);
        expect(Cmd.toTransport(cmd)).to.eql(doc);
        dispose();
      });

      it('Cmd.toPaths', async () => {
        const { doc, dispose } = await setup();

        const test = (paths: t.CmdPaths | undefined, expected: t.CmdPaths) => {
          const cmd = Cmd.create<C>(doc, { paths });
          const res = Cmd.toPaths(cmd);
          expect(res).to.eql(expected);
        };

        const paths: t.CmdPaths = {
          queue: ['x', 'q'],
          log: ['t', 'a'],
        };

        test(paths, paths);
        test(undefined, DEFAULTS.paths);

        dispose();
      });

      it('Cmd.toIssuer', async () => {
        const { doc, dispose } = await setup();
        const issuer = 'bob';
        const cmd1 = Cmd.create<C>(doc);
        const cmd2 = Cmd.create<C>(doc, { issuer });
        expect(Cmd.toIssuer(cmd1)).to.eql(undefined);
        expect(Cmd.toIssuer(cmd2)).to.eql(issuer);
        dispose();
      });

      it('throws: Input not a <Cmd>', () => {
        NON.forEach((input: any) => {
          const err = /Input not a <Cmd>/;
          expect(() => Cmd.toTransport(input)).to.throw(err);
          expect(() => Cmd.toPaths(input)).to.throw(err);
          expect(() => Cmd.toIssuer(input)).to.throw(err);
        });
      });
    });
  });
}
