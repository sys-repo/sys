import { type t, describe, expect, it } from '../../-test.ts';
import { Filters } from './mod.ts';

describe('Media.Config', () => {
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
      const values: Partial<t.MediaFilterValueMap> = {
        contrast: 150,
        grayscale: 25,
        blur: 10,
      };
      const result = Filters.toString(values);
      expect(result).to.eql('contrast(150%) grayscale(25%) blur(10px)'); // NB: ordered.
    });
  });
});
