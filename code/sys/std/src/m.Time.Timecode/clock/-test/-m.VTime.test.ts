import { type t, describe, expect, expectTypeOf, it } from '../../../-test.ts';

import { VTime } from '../mod.ts';

describe('VTime - Virtual Time', () => {
  it('types: branded VTime and conversions', () => {
    const ms = 250 as t.Msecs;
    const v = VTime.fromMsecs(ms);

    // type expectations
    expectTypeOf(v).toEqualTypeOf<t.VTime>();
    expectTypeOf(VTime.zero).toEqualTypeOf<t.VTime>();
    expectTypeOf(VTime.toMsecs(v)).toEqualTypeOf<t.Msecs>();
  });

  it('zero constant', () => {
    expect(VTime.zero).to.equal(0);
    expect(VTime.toMsecs(VTime.zero)).to.equal(0);
    expect(VTime.fromMsecs(0 as t.Msecs)).to.equal(VTime.zero);
  });

  it('roundtrip conversion', () => {
    const ms = 1_234 as t.Msecs;
    const v = VTime.fromMsecs(ms);
    expect(VTime.toMsecs(v)).to.equal(ms);
  });

  it('idempotent wrap/unwrap', () => {
    const a = VTime.fromMsecs(500 as t.Msecs);
    const b = VTime.fromMsecs(VTime.toMsecs(a));
    expect(b).to.equal(a);
  });
});

describe('VClock - Virtual Clock', () => {});
