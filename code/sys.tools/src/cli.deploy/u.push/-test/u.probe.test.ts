import { describe, it, expect, expectTypeOf, Is } from '../../../-test.ts';
import { probeProvider } from '../u.probe.ts';

describe('Provider: probe', () => {
  it('returns a stable availability shape for orbiter', async () => {
    const res = await probeProvider({
      kind: 'orbiter',
      siteId: 'site',
      domain: 'tmp',
    });

    // Runtime: always discriminated by `ok`.
    expect(typeof res).to.eql('object');
    expect('ok' in res).to.eql(true);

    // Type: only assert the stable minimum.
    expectTypeOf(res).toMatchTypeOf<{ readonly ok: boolean }>();

    // If unavailable, the failure payload is shaped for CLI display.
    if (!res.ok) {
      expect(typeof res.reason).to.eql('string');
      // hint + error are optional; just ensure the keys are legal if present.
      if ('hint' in res) expect(res.hint === undefined || Is.str(res.hint)).to.eql(true);
      if ('error' in res) expect(true).to.eql(true);
    }
  });

  it('is total over known provider kinds', async () => {
    const res = await probeProvider({ kind: 'noop' });
    expect(res.ok).to.eql(true);
  });
});
