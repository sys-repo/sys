import { describe, expect, it } from '../../../-test.ts';
import {
  assertAlphaColorInput,
  assertHexColor,
  isAlphaColorInput,
  isHexColor,
  isRgbColor,
  isRgbaColor,
} from '../u.is.ts';

describe('Color input guards', () => {
  describe('isHexColor', () => {
    it('accepts canonical hex forms', () => {
      expect(isHexColor('#fff')).to.eql(true);
      expect(isHexColor('#ffff')).to.eql(true);
      expect(isHexColor('#ffffff')).to.eql(true);
      expect(isHexColor('#ffffffff')).to.eql(true);
    });

    it('rejects malformed hex forms', () => {
      expect(isHexColor('fff')).to.eql(false);
      expect(isHexColor('#ff')).to.eql(false);
      expect(isHexColor('#fffff')).to.eql(false);
      expect(isHexColor('#ggg')).to.eql(false);
    });
  });

  describe('isRgbColor', () => {
    it('accepts rgb strings with spacing', () => {
      expect(isRgbColor('rgb(255, 0, 0)')).to.eql(true);
      expect(isRgbColor('rgb( 255 , 0 , 0 )')).to.eql(true);
    });

    it('rejects non-rgb strings', () => {
      expect(isRgbColor('rgba(255, 0, 0, 1)')).to.eql(false);
      expect(isRgbColor('#ff0000')).to.eql(false);
      expect(isRgbColor('rgb(red, 0, 0)')).to.eql(false);
    });
  });

  describe('isRgbaColor', () => {
    it('accepts rgba strings with bounded alpha', () => {
      expect(isRgbaColor('rgba(255, 0, 0, 0)')).to.eql(true);
      expect(isRgbaColor('rgba(255, 0, 0, 1)')).to.eql(true);
      expect(isRgbaColor('rgba(255, 0, 0, 0.5)')).to.eql(true);
      expect(isRgbaColor('rgba( 255 , 0 , 0 , 0.25 )')).to.eql(true);
    });

    it('rejects malformed rgba strings', () => {
      expect(isRgbaColor('rgb(255, 0, 0)')).to.eql(false);
      expect(isRgbaColor('rgba(255, 0, 0, -0.1)')).to.eql(false);
      expect(isRgbaColor('rgba(255, 0, 0, 1.2)')).to.eql(false);
      expect(isRgbaColor('rgba(red, 0, 0, 0.5)')).to.eql(false);
    });
  });

  describe('isAlphaColorInput', () => {
    it('accepts hex/rgb/rgba and rejects other strings', () => {
      expect(isAlphaColorInput('#fff')).to.eql(true);
      expect(isAlphaColorInput('rgb(255, 0, 0)')).to.eql(true);
      expect(isAlphaColorInput('rgba(255, 0, 0, 0.5)')).to.eql(true);
      expect(isAlphaColorInput('white')).to.eql(false);
      expect(isAlphaColorInput('not-a-color')).to.eql(false);
    });
  });

  describe('assertHexColor', () => {
    it('passes for valid hex and throws for invalid input', () => {
      expect(() => assertHexColor('#fff', 'test')).to.not.throw();
      expect(() => assertHexColor('fff', 'test')).to.throw('test expects a hex color.');
    });
  });

  describe('assertAlphaColorInput', () => {
    it('passes for supported inputs and throws for unsupported input', () => {
      expect(() => assertAlphaColorInput('#fff', 'test')).to.not.throw();
      expect(() => assertAlphaColorInput('rgb(255, 0, 0)', 'test')).to.not.throw();
      expect(() => assertAlphaColorInput('rgba(255, 0, 0, 0.5)', 'test')).to.not.throw();
      expect(() => assertAlphaColorInput('white', 'test')).to.throw(
        'test expects a hex/rgb/rgba color.',
      );
    });
  });
});
