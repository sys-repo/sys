import { describe, expect, it } from '../-test.ts';
import { Args } from './mod.ts';

describe('Args', () => {
  describe('parse', () => {
    /**
     * Source:
     *  - samples:       https://www.npmjs.com/package/minimist
     */
    it('sample: from minimist (1)', () => {
      type Flag = 'beep' | 'boop';
      type Args = { a?: Flag; b?: Flag };
      const cmd = '-a beep -b boop';
      const res = Args.parse<Args>(cmd.split(' '));

      expect(res.a).to.eql('beep');
      expect(res.b).to.eql('boop');
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

    it('--arg=value', () => {
      type T = { num?: number; msg?: string };
      const cmd = '--num=123 --msg hello';
      const res = Args.parse<T>(cmd.split(' '));
      expect(res.num).to.eql(123);
      expect(res.msg).to.eql('hello');
    });
  });
});
