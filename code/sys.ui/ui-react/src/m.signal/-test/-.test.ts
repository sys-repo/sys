import * as Preact from '@preact/signals-react';

import { describe, expect, it } from '../../-test.ts';
import { Signal } from '../mod.ts';
import { useSignalEffect } from '../u.useEffect.ts';
import { useSignalRedrawEffect } from '../u.useRedrawEffect.ts';
import { Obj, StdSignal } from '../common.ts';

/**
 * See [@sys/std/signal] unit tests for basic API
 * usage sceanrios:
 *
 *    • signal     ← (update)
 *    • effect     ← (listen and react to change)
 *    • computed   ← (compound signal value)
 *    • batch      ← (multiple changes, single fire of effect listeners)
 *
 */
describe('Signals', () => {
  it('API', async () => {
    const m = await import('@sys/ui-react');
    const mm = await import('@sys/ui-react/signal');

    expect(m.Signal).to.equal(Signal);
    expect(mm.Signal).to.equal(Signal);

    expect(Signal.create).to.equal(Preact.signal);
    expect(Signal.useSignal).to.equal(Preact.useSignal);
    expect(Signal.useEffect).to.equal(useSignalEffect);
    expect(Signal.useRedrawEffect).to.equal(useSignalRedrawEffect);

    for (const [key, fn] of Obj.entries(StdSignal)) {
      expect(Signal[key]).to.equal(fn);
    }
  });
});
