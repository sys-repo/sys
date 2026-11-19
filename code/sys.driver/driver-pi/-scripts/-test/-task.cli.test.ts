import { describe, expect, it, type t } from '../../src/-test.ts';
import { exitCode } from '../../src/m.cli/mod.ts';

describe('driver-pi/scripts/task.cli outcome projection', () => {
  it('maps only a fully presented GUI failure to status one', () => {
    const gui = (outcome: t.PiCliProfiles.Gui.Outcome): t.PiCliProfiles.Gui => ({
      kind: 'gui',
      input: {},
      parsed: { _: [] },
      outcome,
    });
    expect(exitCode(gui('failed'))).to.eql(1);
    expect(exitCode(gui('quit'))).to.eql(0);
    expect(exitCode(gui('external-cancellation'))).to.eql(0);
    expect(exitCode({ kind: 'exit', input: {} })).to.eql(0);
  });
});
