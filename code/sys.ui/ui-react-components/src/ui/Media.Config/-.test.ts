import { type t, describe, expect, it } from '../../-test.ts';
import { Config } from './mod.ts';

const { Filters, Zoom } = Config;

describe('Media.Config', () => {
  describe('Config.Filters', () => {
    describe('Filters.values', () => {
      it('returns empty object for empty filters array', () => {
        const result = Filters.values([]);
        expect(result).to.eql({});
      });

      it('maps single filter to its initial value', () => {
        const result = Filters.values(['brightness']);
        const brightness = Filters.config.brightness.initial;
        expect(result).to.eql({ brightness });
      });

      it('maps multiple filters to their initial values', () => {
        const keys: t.MediaFilterName[] = ['contrast', 'grayscale', 'blur'];
        const result = Filters.values(keys);
        expect(result).to.eql({
          contrast: Filters.config.contrast.initial,
          grayscale: Filters.config.grayscale.initial,
          blur: Filters.config.blur.initial,
        });
      });
    });

    describe('Filters.toString', () => {
      it('returns empty string for empty values', () => {
        expect(Filters.toString({})).to.eql('');
        expect(Filters.toString()).to.eql('');
      });

      it('formats a single filter into CSS string', () => {
        const result = Filters.toString({ brightness: 120 });
        expect(result).to.eql('brightness(120%)');
      });

      it('formats multiple filters in config order', () => {
        const values: Partial<t.MediaFilterValues> = {
          contrast: 150,
          grayscale: 25,
          blur: 10,
        };
        const result = Filters.toString(values);
        expect(result).to.eql('contrast(150%) grayscale(25%) blur(10px)'); // NB: ordered.
      });
    });
  });

  describe('Config.Zoom', () => {
    describe('Zoom.values', () => {
      it('returns empty object for empty array', () => {
        const result = Zoom.values([]);
        expect(result).to.eql({});
      });

      it('maps single filter to its initial value', () => {
        const result = Zoom.values(['factor']);
        const factor = Zoom.config.factor.initial;
        expect(result).to.eql({ factor });
      });

      it('maps multiple filters to their initial values', () => {
        const result = Zoom.values(['factor', 'centerY']);
        expect(result).to.eql({
          factor: Zoom.config.factor.initial,
          centerY: Zoom.config.centerY.initial,
        });
      });
    });

    describe('to/from ratio', () => {
      it('converts default percent values to ratio', () => {
        const ratio = Zoom.toRatio({});
        expect(ratio).to.eql({ factor: 1, centerX: 0.5, centerY: 0.5 });
      });

      it('converts custom percent values to ratio', () => {
        const ratio = Zoom.toRatio({ factor: 200, centerX: 0, centerY: 100 });
        expect(ratio).to.eql({ factor: 2, centerX: 0, centerY: 1 });
      });

      it('converts default ratio values to percent', () => {
        const percent = Zoom.fromRatio({});
        expect(percent).to.eql({ factor: 100, centerX: 50, centerY: 50 });
      });

      it('converts custom ratio values to percent', () => {
        const percent = Zoom.fromRatio({ factor: 2, centerX: 0, centerY: 1 });
        expect(percent).to.eql({ factor: 200, centerX: 0, centerY: 100 });
      });

      it('round-trips percent → ratio → percent', () => {
        const original = { factor: 150, centerX: 25, centerY: 75 };
        const roundTripped = Zoom.fromRatio(Zoom.toRatio(original));
        expect(roundTripped).to.eql(original);
      });
    });
  });
});
