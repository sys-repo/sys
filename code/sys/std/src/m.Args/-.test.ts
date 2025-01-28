import { c } from '@sys/cli/fmt';
import { describe, expect, it } from '../-test.ts';
import { Args, parseArgs } from './mod.ts';

type O = Record<string, unknown>;

describe('Args', () => {
  it('API', () => {
    expect(Args.parse).to.equal(parseArgs);
  });

  describe('Args.parse', () => {
    const print = <T extends O = O>(argv: string[]) => {
      const args = parseArgs<T>(argv);
      console.info();
      console.info(c.bold('parseArgs:'));
      console.info('argv:', c.cyan(argv.join(' ')));
      console.info(' ↓');
      console.info(' 💦', args);
      console.info();
      return args;
    };

    it('sample: no param → positional args: empty array', () => {
      expect(parseArgs()).to.eql({ _: [] });
    });

    it('sample: basic', () => {
      const args = print(['foo', 'bar', '--foo=123']);
      expect(args).to.eql({ _: ['foo', 'bar'], foo: 123 });
    });

    it('sample: --arg=<value> | --arg <value>', () => {
      const a = parseArgs(['--foo=123']);
      const b = parseArgs(['--foo', '123']);
      const c = parseArgs('--foo 123'.split(' '));

      expect(a).to.eql({ _: [], foo: 123 });
      expect(a).to.eql(b);
      expect(a).to.eql(c);

      // NB: edge-case (not split on space).
      expect(parseArgs(['--foo 123'])).to.eql({ _: [], 'foo 123': true });
    });

    it('sample: composite --arg number | boolean | string', () => {
      const args = print(['--foo=123', '--foo', '--foo=hello', '--foo', 'world']);
      expect(args.foo).to.eql([123, true, 'hello', 'world']);
    });

    it('--arg=value', () => {
      type T = { num?: number; msg?: string };
      const cmd = '--num=123 --msg hello';
      const res = parseArgs<T>(cmd.split(' '));
      expect(res.num).to.eql(123);
      expect(res.msg).to.eql('hello');
    });

    it('sample: alias | defaults', () => {
      type T = { debug?: boolean; help?: string; env: string };
      const options = {
        boolean: ['debug'],
        string: ['help', 'env'],
        default: { env: 'dev' },
        alias: { h: 'help' },
      };

      const argv = '--debug --env=production -h somePositionalArg'.split(' ');
      const args = parseArgs<T>(argv, options);
      print(argv);

      expect(args.help).to.equal('somePositionalArg'); // NB: alias "h" → "help".
      expect((args as any).h).to.equal('somePositionalArg'); // NB: not on <T>.
      expect(args.env).to.equal('production');
    });

    /**
     * Source:
     *  - samples:   https://www.npmjs.com/package/minimist
     */
    it('sample: from minimist (1)', () => {
      type Flag = 'beep' | 'boop';
      type Args = { a?: Flag; b?: Flag };
      const cmd = '-a beep -b boop';
      const res = parseArgs<Args>(cmd.split(' '));

      expect(res.a).to.eql('beep');
      expect(res.b).to.eql('boop');
      expect(res).to.eql({ _: [], a: 'beep', b: 'boop' });
    });

    it('sample: from minimist (2)', () => {
      const cmd = '-x 3 -y 4 -n5 -abc --beep=boop foo bar baz';
      const args = parseArgs(cmd.split(' '));
      expect(args).to.eql({
        _: ['foo', 'bar', 'baz'],
        x: 3,
        y: 4,
        n: 5,
        a: true,
        b: true,
        c: true,
        beep: 'boop',
      });
    });
  });
});
