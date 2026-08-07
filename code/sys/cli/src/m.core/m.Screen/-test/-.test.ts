import { describe, expect, it } from '../../../-test.ts';
import { Cli } from '../../mod.ts';
import { Screen } from '../mod.ts';
import { bottom } from '../u.dock.bottom.ts';
import { events } from '../u.events.ts';
import { repaint } from '../u.repaint.ts';
import { size } from '../u.size.ts';

describe('Cli.Screen', () => {
  it('assembles the screen helpers on the root CLI surface', () => {
    expect(Cli.Screen).to.equal(Screen);
    expect(Screen.size).to.equal(size);
    expect(Screen.events).to.equal(events);
    expect(Screen.repaint).to.equal(repaint);
    expect(Screen.Dock.bottom).to.equal(bottom);
  });
});
