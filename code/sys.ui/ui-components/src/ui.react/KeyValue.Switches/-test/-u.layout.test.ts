import { describe, expect, it, type t } from '../../../-test.ts';
import { D } from '../common.ts';
import { toSwitchLayout } from '../u.layout.ts';

describe('KeyValue.Switches: layout utility', () => {
  it('uses the switch-specific default layout when no caller layout is supplied', () => {
    expect(toSwitchLayout()).to.equal(D.layout);
  });

  it('preserves switch row alignment when caller supplies spaced layout overrides', () => {
    const layout = toSwitchLayout({ kind: 'spaced', columnGap: 10, rowGap: 4 });
    expect(layout).to.eql({ kind: 'spaced', columnGap: 10, rowGap: 4, align: 'start' });
  });

  it('preserves explicit caller spaced alignment', () => {
    const layout = toSwitchLayout({ kind: 'spaced', columnGap: 10, rowGap: 4, align: 'center' });
    expect(layout).to.eql({ kind: 'spaced', columnGap: 10, rowGap: 4, align: 'center' });
  });

  it('passes through non-spaced layouts', () => {
    const layout: t.KeyValue.Layout.Table = { kind: 'table', columnGap: 10, rowGap: 4 };
    expect(toSwitchLayout(layout)).to.equal(layout);
  });
});
