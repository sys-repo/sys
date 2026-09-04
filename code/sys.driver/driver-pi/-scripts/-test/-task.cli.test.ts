import { describe, EsmAssert, expect, it, type t } from '../../src/-test.ts';
import { exitCode } from '../../src/m.core/m.cli/mod.ts';

const ENTRY = new URL('../task.cli.ts', import.meta.url).pathname;

describe('driver-pi/scripts/task.cli outcome projection', () => {
  it('keeps the default task graph outside GUI and server runtime', async () => {
    await EsmAssert.runtimeGraphBoundary({
      entry: ENTRY,
      forbiddenImports: ['@sys/server'],
      forbiddenPathIncludes: [
        '/m.cli.profiles/u.start/',
        '\\m.cli.profiles\\u.start\\',
      ],
    });
  });

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
