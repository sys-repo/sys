import { describe, expectTypeOf, it } from '../../-test.ts';
import { EffectController } from '../mod.ts';
import { createFakeRef } from './u.fixture.ts';

describe('EffectController.create overloads', () => {
  it('defaults to Partial<State> patches when applyPatch is omitted', () => {
    const ref = createFakeRef<{ readonly k?: number }>({});
    const ctrl = EffectController.create<{ readonly k?: number }>({ ref });

    ctrl.next({ k: 1 });
    // @ts-expect-error default overload rejects non-object patch types
    ctrl.next('x');

    expectTypeOf(ctrl.next).toEqualTypeOf<(patch?: Partial<{ readonly k?: number }>) => void>();
    ctrl.dispose();
  });

  it('accepts custom patch types when applyPatch is provided', () => {
    const ref = createFakeRef<{ k: number }>({ k: 0 });
    const ctrl = EffectController.create<{ k: number }, string>({
      ref,
      applyPatch(draft, patch) {
        draft.k = Number(patch);
      },
    });

    ctrl.next('x');
    // @ts-expect-error custom overload rejects object patch
    ctrl.next({ k: 1 });

    expectTypeOf(ctrl.next).toEqualTypeOf<(patch?: string) => void>();
    ctrl.dispose();
  });
});
