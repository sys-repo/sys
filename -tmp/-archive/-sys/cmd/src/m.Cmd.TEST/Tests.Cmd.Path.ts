import { Cmd } from '../mod.ts';
import { DEFAULTS, type t } from './common.ts';

const Path = Cmd.Path;

export function pathTests(_setup: t.CmdTestSetup, args: t.TestArgs) {
  const { describe, it, expect } = args;

  describe('Cmd.Path', () => {
    describe('wrangle', () => {
      it('<undefined> (defaults)', () => {
        expect(Path.wrangle()).to.equal(DEFAULTS.paths);
        expect(Path.wrangle(undefined)).to.equal(DEFAULTS.paths);
        expect(Path.wrangle(null as any)).to.equal(DEFAULTS.paths);
      });

      it('{paths} object', () => {
        const custom: t.CmdPaths = {
          queue: ['z', 'q'],
          log: ['t', 'a'],
        };
        expect(Path.wrangle(DEFAULTS.paths)).to.eql(DEFAULTS.paths);
        expect(Path.wrangle(custom)).to.eql(custom);
      });

      it('prefix [path]', () => {
        const prefix = ['foo', 'bar'];
        const res = Path.wrangle(prefix);
        expect(res).to.eql(Path.prepend(prefix));
      });
    });

    describe('Path.resolver', () => {
      type P = { foo: number };
      type C = t.CmdType<'Foo', P>;

      it('default paths', () => {
        const resolve = Path.resolver();
        expect(resolve.paths).to.eql(DEFAULTS.paths);

        const obj: t.CmdPathsObject = { queue: [] };
        expect(resolve.queue.list(obj)).to.eql([]);
        expect(resolve.toObject(obj)).to.eql({
          queue: [],
          total: DEFAULTS.log(),
        });
      });

      it('custom paths: {object}', () => {
        const resolve = Path.resolver({
          queue: ['z', 'q'],
          log: ['t', 'a'],
        });
        const obj = {
          z: { q: [] },
        };
        expect(resolve.queue.list(obj)).to.eql([]);
        expect(resolve.toObject(obj)).to.eql({
          queue: [],
          total: DEFAULTS.log(),
        });
      });

      it('custom paths: [prepended]', () => {
        const resolve = Path.resolver(['foo', 'bar']);
        const cmd: t.CmdPathsObject = { queue: [] };
        const obj = { foo: { bar: cmd } };
        expect(resolve.queue.list(obj)).to.eql(cmd.queue);
        expect(resolve.toObject(obj)).to.eql({
          queue: [],
          total: DEFAULTS.log(),
        });
      });

      it('.queue.list ← generates new [array]', () => {
        const resolve = Path.resolver(DEFAULTS.paths);
        const obj1: t.CmdPathsObject<C> = {};
        const obj2: t.CmdPathsObject<C> = { queue: [] };
        expect(resolve.queue.list(obj1)).to.eql([]);
        expect(resolve.queue.list(obj2)).to.equal(obj2.queue); // NB: mutated (added).
      });

      describe('.queue.index(n)', () => {
        it('index <undefined> ← adds to end of list', () => {
          const resolve = Path.resolver();
          const obj: t.CmdPathsObject<C> = {};

          const res1 = resolve.queue.item(obj);
          const res2 = resolve.queue.item(obj);

          expect(res1.index).to.eql(0);
          expect(res2.index).to.eql(1);
          expect(obj.queue?.length).to.equal(2);

          expect(res1.path).to.eql(['queue', 0]);
          expect(res2.path).to.eql(['queue', 1]);
        });

        it('index specified ← retrieves existing', () => {
          const resolve = Path.resolver();
          const obj: t.CmdPathsObject<C> = {};

          resolve.queue.item(obj);
          resolve.queue.item(obj);
          const item = obj.queue?.[1];
          resolve.queue.item(obj, 1); // NB: retrieve existing.

          expect(obj.queue).to.eql([{}, {}]); // NB: blank item upon first request.
          expect(obj.queue?.[1]).to.equal(item); // NB: same instance (not clobbered).
        });

        it('index.name', () => {
          const resolve = Path.resolver();
          const obj: t.CmdPathsObject<C> = {};
          const res1 = resolve.queue.item(obj);
          const res2 = resolve.queue.item(obj);

          expect(res1.name()).to.eql('');
          expect(res2.name('foo')).to.eql('foo');
          expect(obj.queue?.[0].name).to.equal('');
          expect(obj.queue?.[1].name).to.equal('foo');
        });

        it('index.params', () => {
          const resolve = Path.resolver();
          const obj: t.CmdPathsObject<C> = {};
          const res1 = resolve.queue.item(obj);
          const res2 = resolve.queue.item(obj);
          const params = { foo: 123 };

          expect(res1.params({})).to.eql({});
          expect(res2.params(params)).to.eql(params);
          expect(obj.queue?.[0].params).to.eql({});
          expect(obj.queue?.[1].params).to.eql(params);
        });

        it('index.error', () => {
          const resolve = Path.resolver();
          const obj: t.CmdPathsObject<C> = {};
          const res1 = resolve.queue.item(obj);
          const res2 = resolve.queue.item(obj);
          const error = { msg: '🐷' };

          expect(res1.error({})).to.eql({});
          expect(res2.error(error)).to.eql(error);
          expect(obj.queue?.[0].error).to.eql({});
          expect(obj.queue?.[1].error).to.eql(error);
        });

        it('index.tx', () => {
          const resolve = Path.resolver();
          const obj: t.CmdPathsObject<C> = {};
          const res1 = resolve.queue.item(obj);
          const res2 = resolve.queue.item(obj);

          expect(res1.tx()).to.be.string;
          expect(res2.tx('my.tx')).to.eql('my.tx');
          expect(obj.queue?.[0].tx).to.eql(res1.tx());
          expect(obj.queue?.[1].tx).to.eql('my.tx');
        });

        it('index.id', () => {
          const resolve = Path.resolver();
          const obj: t.CmdPathsObject<C> = {};
          const res1 = resolve.queue.item(obj);
          const res2 = resolve.queue.item(obj);

          expect(res1.id()).to.be.string;
          expect(res2.id('my.id')).to.eql('my.id');
          expect(obj.queue?.[0].id).to.eql(res1.id());
          expect(obj.queue?.[1].id).to.eql('my.id');
        });

        it('index.issuer', () => {
          const resolve = Path.resolver();
          const obj: t.CmdPathsObject<C> = {};
          const res1 = resolve.queue.item(obj);
          const res2 = resolve.queue.item(obj);

          expect(res1.issuer()).to.eql(undefined);
          expect(res2.issuer('jen')).to.eql('jen');
          expect(obj.queue?.[0].issuer).to.eql(undefined);
          expect(obj.queue?.[1].issuer).to.eql('jen');
        });
      });

      it('.log', () => {
        const resolve = Path.resolver(DEFAULTS.paths);
        const obj: t.CmdPathsObject = {};
        const res = resolve.log(obj);
        expect(obj.log).to.eql(res);
        expect(res).to.eql(DEFAULTS.log());
        expect(res.total.purged).to.eql(0);
      });
    });

    describe('Path.prepend', () => {
      it('defaults', () => {
        const test = (paths?: t.CmdPaths) => {
          const res = Path.prepend(['foo', 'bar'], paths);
          expect(res).to.eql({
            queue: ['foo', 'bar', 'queue'],
            log: ['foo', 'bar', 'log'],
          });
        };

        test();
        test(DEFAULTS.paths);
      });

      it('custom', () => {
        const input: t.CmdPaths = {
          queue: ['z', 'q'],
          log: ['t', 'a'],
        };
        const res = Path.prepend(['foo'], input);
        expect(res).to.eql({
          queue: ['foo', 'z', 'q'],
          log: ['foo', 't', 'a'],
        });
      });
    });

    describe('Path.is', () => {
      it('is.stringArray', () => {
        const NOT1 = [undefined, null, 123, true, {}, Symbol('foo'), BigInt(123), ''];
        const NOT2 = [['', 1], ['', true], [{}], ['', null]];
        NOT1.forEach((value) => expect(Path.Is.stringArray(value)).to.eql(false));
        NOT2.forEach((value) => expect(Path.Is.stringArray(value)).to.eql(false));
        expect(Path.Is.stringArray(['hello', '👋'])).to.eql(true);
        expect(Path.Is.stringArray([])).to.eql(true);
      });

      it('is.commandPaths', () => {
        const NOT = [undefined, null, 123, true, {}, [], Symbol('foo'), BigInt(123), ''];
        NOT.forEach((value) => expect(Path.Is.commandPaths(value)).to.eql(false));
        expect(Path.Is.commandPaths({ counter: [1], name: ['hello'], params: [] })).to.eql(false);
        expect(Path.Is.commandPaths(DEFAULTS.paths)).to.eql(true);
        expect(Path.Is.commandPaths({ queue: ['a', 'b'] })).to.eql(true);
      });
    });
  });
}
