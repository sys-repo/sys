import { describe, expect, expectTypeOf, it } from '../../-test.ts';
import { type t } from '../common.ts';
import { Shell } from '../mod.ts';

describe('Shell', () => {
  it('API', async () => {
    const m = await import('@sys/cli/shell');
    expect(m.Shell).to.equal(Shell);
    expectTypeOf(m.Shell).toEqualTypeOf<t.Shell.Lib>();
  });
});
