import { describe, expect, expectTypeOf, it } from '../../-test.ts';
import { Shell } from '../mod.ts';
import type { Shell as TShell } from '../t.ts';

describe('Shell', () => {
  it('API', async () => {
    const m = await import('@sys/cli/shell');
    expect(m.Shell).to.equal(Shell);
    expectTypeOf(m.Shell).toEqualTypeOf<TShell.Lib>();
  });
});
