import type { Shell as ShellFromT } from '@sys/cli/t';
import type { Shell as ShellFromTypes } from '@sys/cli/types';
import { describe, expect, expectTypeOf, it } from '../../-test.ts';
import { type t } from '../common.ts';
import { Shell } from '../mod.ts';

describe('Shell', () => {
  it('API', async () => {
    const m = await import('@sys/cli/shell');
    expect(m.Shell).to.equal(Shell);
    expectTypeOf(m.Shell).toEqualTypeOf<t.Shell.Lib>();
    expectTypeOf(m.Shell.Plan).toEqualTypeOf<t.Shell.Plan.Lib>();
    expectTypeOf(m.Shell.Plan).toEqualTypeOf<ShellFromT.Plan.Lib>();
    expectTypeOf(m.Shell.Plan).toEqualTypeOf<ShellFromTypes.Plan.Lib>();
  });
});
