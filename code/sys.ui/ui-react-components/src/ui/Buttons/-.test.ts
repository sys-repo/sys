import { describe, expect, it } from '../../-test.ts';
import { Button } from '../Button/mod.ts';
import { ButtonsIcons } from '../Buttons.Icons/mod.ts';
import { Switch } from '../Buttons.Switch/mod.ts';
import { Buttons } from './mod.ts';

describe('Lib: Buttons', () => {
  it('API', () => {
    expect(Buttons.Icons).to.equal(ButtonsIcons);
    expect(Buttons.Button.Default).to.equal(Button);
    expect(Buttons.Switch).to.equal(Switch);
  });
});
