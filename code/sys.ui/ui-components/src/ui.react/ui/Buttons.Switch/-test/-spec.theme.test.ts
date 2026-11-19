import { describe, expect, it } from '../../../-test.ts';
import { createDebugSignals } from '../-spec/-SPEC.Debug.tsx';
import { SwitchTheme } from '../u.theme.ts';

describe('Buttons.Switch: spec theme', () => {
  it('keeps the theme name separate from color variations across theme changes', () => {
    const debug = createDebugSignals();
    const p = debug.props;
    expect(debug.switchTheme).to.eql('Light');

    p.theme.value = 'Dark';
    for (const color of ['green', 'yellow', 'blue'] as const) {
      debug.updateTheme(color);
      expect(p.theme.value).to.eql('Dark');
      expect(debug.switchTheme).to.eql(SwitchTheme.dark[color]);
    }

    p.theme.value = 'Light';
    expect(p.color.value).to.eql('blue');
    expect(debug.switchTheme).to.eql(SwitchTheme.light.blue);
  });
});
