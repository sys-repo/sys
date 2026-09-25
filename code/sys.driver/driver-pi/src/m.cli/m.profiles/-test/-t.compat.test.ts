import { describe, expectTypeOf, it } from '../../../-test.ts';
import type { Keyboard as CommonKeyboard } from '../../../common/t.ts';
import type { PiCliProfiles } from '@sys/driver-pi/t';
import type { Keyboard } from '@sys/ui-dom/t';

type GuiOutcome = PiCliProfiles.Gui['outcome'];
type ExpectedGuiOutcome = 'quit' | 'external-cancellation' | 'failed';

describe('@sys/driver-pi profile type compatibility', () => {
  it('carries ordinary non-back GUI outcomes through the package type entry', () => {
    const outcome: GuiOutcome = 'quit';
    expectTypeOf<GuiOutcome>(outcome).toEqualTypeOf<ExpectedGuiOutcome>();
    expectTypeOf<PiCliProfiles.Gui.Outcome>(outcome).toEqualTypeOf<GuiOutcome>();
  });

  it('retains the established common Keyboard type spine', () => {
    const keyboard = {} as CommonKeyboard.Lib;
    expectTypeOf<CommonKeyboard.Lib>(keyboard).toEqualTypeOf<Keyboard.Lib>();
  });
});
