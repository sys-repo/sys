import { Lease as StdLease } from '@sys/std/async';

import { describe, expect, it } from '../../-test.ts';
import { Lease } from '../mod.ts';

describe('Async:', () => {
  it('API: Lease', async () => {
    const m = await import('@sys/ui-react/async');
    expect(m.Lease).to.equal(Lease);
    expect(Lease.make).to.equal(StdLease.make);
    expect(Lease.guard).to.equal(StdLease.guard);
  });
});
