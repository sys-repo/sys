import { describe, expect, it } from '../../-test.ts';
import { MonorepoInfo } from '../mod.ts';

describe(`Monorepo.Info`, () => {
  it('API', async () => {
    const m = await import('@sys/monorepo/info');
    expect(m.MonorepoInfo).to.equal(MonorepoInfo);
  });

  it('formats a runtime and monorepo stats block', () => {
    const text = MonorepoInfo.fmt({
      runtime: { deno: '2.7.4', typescript: '5.9.2', v8: '14.x' },
      source: { include: ['code/**/*.{ts,tsx}'], exclude: [] },
      files: 12,
      lines: 345,
    });

    expect(text.includes('Deno')).to.eql(true);
    expect(text.includes('typescript')).to.eql(true);
    expect(text.includes('Monorepo')).to.eql(true);
    expect(text.includes('code/**/*.{ts,tsx}')).to.eql(true);
    expect(text.includes('12')).to.eql(true);
    expect(text.includes('345')).to.eql(true);
  });
});
