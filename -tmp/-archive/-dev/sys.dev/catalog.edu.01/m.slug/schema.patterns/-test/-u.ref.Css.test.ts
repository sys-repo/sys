import { describe, expect, it } from '../../../-test.ts';
import { Value, toSchema } from '../common.ts';
import { Css } from '../u.ui.Css.ts';

describe('UI: Css Props Spec', () => {
  describe('Css.Margin()', () => {
    const spec = Css.Margin();
    const schema = toSchema(spec);

    it('accepts number pixels (>= 0)', () => {
      const ok = [0, 1, 8, 12, 100, 1024];
      for (const v of ok) expect(Value.Check(schema, v)).to.eql(true);
    });

    it('accepts CSS shorthand strings', () => {
      const ok = ['0', '8', '8 12', '8 12 16 4', '8px 12px', '1rem', '0 0 0 0'];
      for (const v of ok) expect(Value.Check(schema, v)).to.eql(true);
    });

    it('rejects negatives and invalid shapes', () => {
      const bad = [
        -1,
        -0.1,
        true,
        false,
        null,
        undefined,
        {},

        // Invalid arrays by length:
        [],
        [8, 12, 16], // length 3 not allowed

        // Invalid arrays by content:
        [-1], // negative in array
        [8, -12],
        [0, 0, -1, 0],
        [8, { a: 1 }],
        [8, [1]],
        [8, true, 0, 0],
      ];

      for (const v of bad) expect(Value.Check(schema, v as unknown)).to.eql(false, v);
    });

    it('accepts arrays of length 1, 2, and 4 (number|string elements)', () => {
      const ok = [
        [8],
        ['8'],
        ['8 12'], // single string element (valid)
        [8, 12],
        ['8', '12'],
        [8, '12'],
        [8, 12, 16, 4],
        ['8', '12', '16', '4'],
        [8, '12', 16, '4'],
      ];
      for (const v of ok) expect(Value.Check(schema, v)).to.eql(true, v);
    });
  });
});
