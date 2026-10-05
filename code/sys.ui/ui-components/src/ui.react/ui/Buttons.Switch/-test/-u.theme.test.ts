import { describe, expect, it, type t } from '../../../-test.ts';
import { SwitchTheme } from '../u.theme.ts';

describe('Buttons.Switch: SwitchTheme', () => {
  it('merge preserves nested theme defaults and returns a clone', () => {
    const base: t.Switch.Theme.Root = {
      trackColor: { on: 'blue', off: -0.1, disabled: -0.2 },
      thumbColor: { on: 'white', off: 'white', disabled: 'gray' },
      shadowColor: -0.3,
      disabledOpacity: 0.45,
    };

    type T = t.Switch.Theme.Root['trackColor'];
    const res = SwitchTheme.merge(base, { trackColor: { on: 'green' } as T });

    expect(res).to.eql({
      trackColor: { on: 'green', off: -0.1, disabled: -0.2 },
      thumbColor: { on: 'white', off: 'white', disabled: 'gray' },
      shadowColor: -0.3,
      disabledOpacity: 0.45,
    });
    expect(res).to.not.equal(base);
    expect(res.trackColor).to.not.equal(base.trackColor);
  });
});
