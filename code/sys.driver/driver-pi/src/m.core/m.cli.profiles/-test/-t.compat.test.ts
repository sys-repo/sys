import { describe, expectTypeOf, it, type t } from '../../../-test.ts';
import type { Keyboard as CommonKeyboard } from '../../../common/t.ts';
import type { PiCliProfiles } from '@sys/driver-pi/t';
import type { Keyboard } from '@sys/ui-dom/t';

describe('@sys/driver-pi profile type compatibility', () => {
  it('retains the public start:gui source pair through the package type entry', () => {
    const source = {} as PiCliProfiles.StartGuiSource;
    expectTypeOf<PiCliProfiles.StartGuiSource>(source).toEqualTypeOf<{
      manifestUrl: t.StringUrl;
      integrity: t.StringHash;
    }>();
  });

  it('retains the established common Keyboard type spine', () => {
    const keyboard = {} as CommonKeyboard.Lib;
    expectTypeOf<CommonKeyboard.Lib>(keyboard).toEqualTypeOf<Keyboard.Lib>();
  });
});
