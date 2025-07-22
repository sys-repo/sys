import { describe, expect, it } from '../../-test.ts';
import { resolveCropEnd } from './u.ts';

describe('Player.Video: Element', () => {
  describe('calc: resolveCropEnd', () => {
    const duration = 120;

    it('returns full duration when rawEnd is undefined', () => {
      const result = resolveCropEnd(undefined, duration);
      expect(result).to.eql(duration);
    });

    it('returns rawEnd when rawEnd is positive and within duration', () => {
      const rawEnd = 30;
      const result = resolveCropEnd(rawEnd, duration);
      expect(result).to.eql(rawEnd);
    });

    it('returns duration when rawEnd equals duration', () => {
      const rawEnd = duration;
      const result = resolveCropEnd(rawEnd, duration);
      expect(result).to.eql(duration);
    });

    it('returns 0 when rawEnd is negative beyond negative duration (eg. too far from end)', () => {
      const rawEnd = -(duration + 10);
      const result = resolveCropEnd(rawEnd, duration);
      expect(result).to.eql(0);
    });

    it('converts negative rawEnd to duration + rawEnd', () => {
      const rawEnd = -30;
      const expected = duration + rawEnd; // 120 - 30 = 90
      const result = resolveCropEnd(rawEnd, duration);
      expect(result).to.eql(expected);
    });

    it('clamps negative converted value to zero when it would be negative', () => {
      const rawEnd = -200; // duration + rawEnd = -80
      const result = resolveCropEnd(rawEnd, duration);
      expect(result).to.eql(0);
    });
  });
});
