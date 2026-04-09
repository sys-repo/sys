import { describe, expect, it } from '../../-test.ts';
import { ViteLog } from '../../m.fmt/mod.ts';

describe('Vite.build elapsed formatting', () => {
  it('keeps sub-minute output compact', () => {
    expect(ViteLog.elapsed(59_000)).to.eql('59s');
  });

  it('shows fixed two-decimal minutes after one minute', () => {
    expect(ViteLog.elapsed(125_000)).to.eql('2.08m');
  });
});
