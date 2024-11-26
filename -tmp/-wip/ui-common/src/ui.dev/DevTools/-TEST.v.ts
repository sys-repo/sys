import { Helpers } from '.';
import { describe, expect, it } from '../../test';

describe('DevTools', () => {
  describe('Helpers', () => {
    it('toggle', () => {
      const template = {
        true: true,
        false: false,
        number: 123,
        text: 'hello',
        child: {},
        list: [],
        null: null,
        undefined: undefined,
      };

      type T = typeof template;
      type K = keyof T;

      const test = (key: K, expected: boolean, mutated: boolean) => {
        const obj = { ...template };
        const res = Helpers.toggle(obj, key);
        expect(res).to.eql(expected);

        if (mutated) {
          expect(obj[key]).to.eql(expected);
        } else {
          expect(obj[key]).to.eql(template[key]);
        }
      };

      test('true', false, true);
      test('false', true, true);
      test('undefined', true, true); // NB: toggles [undefined => false] to [true].

      (['number', 'text', 'child', 'list', 'null', 'number'] as K[]).forEach((key) => {
        const fn = () => test(key, false, false);
        expect(fn).to.throw(/not a boolean/);
      });
    });
  });
});
