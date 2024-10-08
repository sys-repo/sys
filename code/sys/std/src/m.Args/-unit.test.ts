import { describe, it, expect, type t } from '../-test.ts';
import { Args } from './mod.ts';

describe('Args', () => {
  describe('parse', () => {
    /**
     * Source: https://jsr.io/@std/cli
     */
    it('sample: from deno', () => {
      const argv = ['--foo', '--bar=baz', './quux.txt'];
      const res = Args.parse(argv);
      expect(res).to.eql({ foo: true, bar: 'baz', _: ['./quux.txt'] });
    });

    /**
     * Source: https://www.npmjs.com/package/minimist
     */
    it('sample: from minimist (1)', () => {
      const cmd = '-a beep -b boop';
      const res = Args.parse(cmd.split(' '));
      expect(res).to.eql({ _: [], a: 'beep', b: 'boop' });
    });

    it('sample: from minimist (2)', () => {
      const cmd = '-x 3 -y 4 -n5 -abc --beep=boop foo bar baz';
      const res = Args.parse(cmd.split(' '));
      expect(res).to.eql({
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
