import { describe, expect, it } from '../../../-test.ts';
import { Settings } from '../mod.ts';

describe(`Pi: settings`, () => {
  it('API', async () => {
    const m = await import('../mod.ts');
    expect(m.Settings).to.equal(Settings);
    expect(m.Settings.Fs).to.equal(Settings.Fs);
    expect(m.Settings.resolve).to.equal(Settings.resolve);
    expect('write' in m.Settings).to.eql(false);
  });
});
