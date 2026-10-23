import { describe, expect, expectTypeOf, it, type t } from '../../../-test.ts';
import { bottom } from '../u.dock.bottom.ts';

describe('Cli.Screen.Dock.bottom', () => {
  it('keeps a complete footer at the final rows of the available region', () => {
    const rows = bottom({
      capacity: 6,
      flow: ['status'],
      footer: ['divider', 'controls'],
    });

    expectTypeOf(bottom).toEqualTypeOf<t.CliScreen.Dock.Bottom>();
    expect(rows).to.eql(['status', '', '', '', 'divider', 'controls']);
  });

  it('drops the entire footer before it removes flowing rows', () => {
    expect(bottom({
      capacity: 2,
      flow: ['status', 'output'],
      footer: ['divider', 'controls'],
    })).to.eql(['status', 'output']);
  });

  it('bounds invalid and overflow capacity without retaining a partial footer', () => {
    expect(bottom({
      capacity: -1,
      flow: ['status'],
      footer: ['controls'],
    })).to.eql([]);
    expect(bottom({
      capacity: 1.9,
      flow: ['status'],
      footer: ['controls'],
    })).to.eql(['status']);
  });
});
