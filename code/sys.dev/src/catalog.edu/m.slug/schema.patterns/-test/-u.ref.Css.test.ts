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

    it('rejects negatives and non (number|string)', () => {
      const bad = [-1, -0.1, true, false, null, undefined, [], {}, ['8 12']];
      for (const v of bad) expect(Value.Check(schema, v as unknown)).to.eql(false);
    });
  });
});
