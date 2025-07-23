import { describe, expect, it } from '../../-test.ts';
import { Crop } from './m.Crop.ts';

describe('Player.Video: Element', () => {
  describe('Crop', () => {
    describe('Crop.resolveEnd', () => {
      const duration = 120;

      it('returns full duration when rawEnd is undefined', () => {
        const result = Crop.resolveEnd(undefined, duration);
        expect(result).to.eql(duration);
      });

      it('returns rawEnd when rawEnd is positive and within duration', () => {
        const rawEnd = 30;
        const result = Crop.resolveEnd(rawEnd, duration);
        expect(result).to.eql(rawEnd);
      });

      it('returns duration when rawEnd equals duration', () => {
        const rawEnd = duration;
        const result = Crop.resolveEnd(rawEnd, duration);
        expect(result).to.eql(duration);
      });

      it('returns 0 when rawEnd is negative beyond negative duration (eg. too far from end)', () => {
        const rawEnd = -(duration + 10);
        const result = Crop.resolveEnd(rawEnd, duration);
        expect(result).to.eql(0);
      });

      it('converts negative rawEnd to duration + rawEnd', () => {
        const rawEnd = -30;
        const expected = duration + rawEnd; // 120 - 30 = 90
        const result = Crop.resolveEnd(rawEnd, duration);
        expect(result).to.eql(expected);
      });

      it('clamps negative converted value to zero when it would be negative', () => {
        const rawEnd = -200; // duration + rawEnd = -80
        const result = Crop.resolveEnd(rawEnd, duration);
        expect(result).to.eql(0);
      });
    });

    describe('Crop.lens', () => {
      it('produces full = cropped when no crop is provided', () => {
        const lens = Crop.lens(undefined, 100);
        expect(lens.duration.full).to.eql(100);
        expect(lens.duration.cropped).to.eql(100);
      });

      it('calculates cropped duration using [positive] start and [negative] end offsets', () => {
        const lens = Crop.lens({ start: 10, end: -20 }, 100);

        expect(lens.duration.full).to.eql(100); //    ← Full stays the same:
        expect(lens.duration.cropped).to.eql(70); //  ← Cropped = 100 - 10 - 20 = 70:
      });

      it('accepts tuple as input', () => {
        const lens = Crop.lens([10, -20], 100);
        expect(lens.duration.full).to.eql(100);
        expect(lens.duration.cropped).to.eql(70);
      });

      it('toCropped maps a full-time into the cropped range and back via toFull', () => {
        const lens = Crop.lens({ start: 5, end: -5 }, 50);
        const fullTime = 25;
        const croppedTime = lens.toCropped(fullTime);
        expect(croppedTime).to.eql(20); // 25 - 5.
        expect(lens.toFull(croppedTime)).to.eql(25);
      });

      it('clamp constrains full-times to the crop bounds', () => {
        const lens = Crop.lens({ start: 10, end: 30 }, 100);
        expect(lens.clamp(0)).to.eql(10); //    Below start → start.
        expect(lens.clamp(50)).to.eql(30); //   Above end   → end.
        expect(lens.clamp(20)).to.eql(20); //   Within      → unchanged.
      });

      it('range input <undefined>', () => {
        const lens = Crop.lens(undefined, 10);
        expect(lens.range.start).to.eql(0);
        expect(lens.range.end).to.eql(10);
      });
    });
  });
});
