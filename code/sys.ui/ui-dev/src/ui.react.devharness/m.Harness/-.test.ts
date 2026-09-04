import { describe, expect, it } from '../-test.ts';
import { Theme } from '../u/mod.ts';
import { Harness as UI } from '../ui/Harness/mod.ts';
import { Harness } from './mod.ts';

describe('Harness', () => {
  it('public API', async () => {
    const m = await import('@sys/ui-dev/react/devharness');

    expect(m.Harness).to.equal(Harness);
    expect('Dev' in m).to.equal(false);
    expect(Harness.Theme).to.equal(Theme);
    expect(Harness.UI).to.equal(UI);
  });
});
