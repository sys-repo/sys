import { describe, expect, it } from '../../../-test.ts';
import { Value, toSchema } from '../common.ts';
import { Cropmarks } from '../u.ui.Cropmarks.ts';

describe('UI: Cropmarks Props Spec', () => {
  describe('Percent()', () => {
    const schema = toSchema(Cropmarks.Percent());

    it('valid: 0..100 inclusive', () => {
      for (const v of [0, 1, 50, 99.5, 100]) expect(Value.Check(schema, v)).to.eql(true);
    });

    it('invalid: <0 or >100 or non-number', () => {
      for (const v of [-1, 100.0001, '50', null, undefined, {}, []])
        expect(Value.Check(schema, v as unknown)).to.eql(false);
    });
  });

  describe('SizeMode()', () => {
    const schema = toSchema(Cropmarks.SizeMode());

    it('valid modes', () => {
      for (const v of ['center', 'fill', 'percent']) expect(Value.Check(schema, v)).to.eql(true);
    });

    it('invalid modes', () => {
      for (const v of ['', 'CENTER', 'fit', 0, null, undefined])
        expect(Value.Check(schema, v as unknown)).to.eql(false);
    });
  });

  describe('SizeCenter()', () => {
    const schema = toSchema(Cropmarks.SizeCenter());

    it('valid: mode only (width/height optional)', () => {
      for (const v of [{ mode: 'center' }]) expect(Value.Check(schema, v)).to.eql(true);
    });

    it('valid: width and/or height (>= 0)', () => {
      for (const v of [
        { mode: 'center', width: 0 },
        { mode: 'center', height: 0 },
        { mode: 'center', width: 640 },
        { mode: 'center', height: 480 },
        { mode: 'center', width: 640, height: 480 },
      ])
        expect(Value.Check(schema, v)).to.eql(true);
    });

    it('invalid: negatives, wrong types, extra props', () => {
      for (const v of [
        { mode: 'center', width: -1 },
        { mode: 'center', height: -1 },
        { mode: 'center', width: '640' },
        { mode: 'center', height: '480' },
        { mode: 'center', foo: 1 },
        { mode: 'CENTER' },
        {},
      ])
        expect(Value.Check(schema, v as unknown)).to.eql(false);
    });
  });

  describe('SizeFill()', () => {
    const schema = toSchema(Cropmarks.SizeFill());

    it('valid: mode only or with x/y/margin', () => {
      for (const v of [
        { mode: 'fill' },
        { mode: 'fill', x: true },
        { mode: 'fill', y: true },
        { mode: 'fill', x: true, y: true },
        { mode: 'fill', margin: 0 },
        { mode: 'fill', margin: 8 },
        { mode: 'fill', margin: '8 12' },
      ])
        expect(Value.Check(schema, v)).to.eql(true);
    });

    it('invalid: wrong types, extra props', () => {
      for (const v of [
        { mode: 'fill', x: 'true' },
        { mode: 'fill', y: 'false' },
        { mode: 'fill', margin: -1 },
        { mode: 'fill', foo: 1 },
        { mode: 'FILL' },
        {},
      ])
        expect(Value.Check(schema, v as unknown)).to.eql(false);
    });
  });

  describe('SizePercent()', () => {
    const schema = toSchema(Cropmarks.SizePercent());

    it('valid: mode only (width/height optional)', () => {
      for (const v of [{ mode: 'percent' }]) expect(Value.Check(schema, v)).to.eql(true);
    });

    it('valid: width/height 0..100; aspectRatio string or >0 number; maxWidth/maxHeight 0..100', () => {
      for (const v of [
        { mode: 'percent', width: 80 },
        { mode: 'percent', height: 50 },
        { mode: 'percent', width: 80, height: 50 },
        { mode: 'percent', width: 90, aspectRatio: '16/9' },
        { mode: 'percent', height: 75, aspectRatio: 1.618 },
        { mode: 'percent', maxWidth: 100, maxHeight: 100 },
        { mode: 'percent', margin: 8 },
        { mode: 'percent', margin: '8 12' },
      ])
        expect(Value.Check(schema, v)).to.eql(true);
    });

    it('invalid: out-of-range percents, bad aspectRatio, extras', () => {
      for (const v of [
        { mode: 'percent', width: -1 },
        { mode: 'percent', height: 101 },
        { mode: 'percent', maxWidth: 200 },
        { mode: 'percent', aspectRatio: 0 },
        { mode: 'percent', aspectRatio: -1 },
        { mode: 'percent', margin: -1 },
        { mode: 'percent', foo: 1 },
        { mode: 'PERCENT' },
        {},
      ])
        expect(Value.Check(schema, v as unknown)).to.eql(false);
    });
  });

  describe('Size() [union]', () => {
    const schema = toSchema(Cropmarks.Size());

    it('accepts any valid variant', () => {
      for (const v of [
        { mode: 'center' },
        { mode: 'fill', x: true, y: false },
        { mode: 'percent', width: 72, height: 72, maxWidth: 90, maxHeight: 80 },
      ])
        expect(Value.Check(schema, v)).to.eql(true);
    });

    it('rejects invalid objects or wrong mode', () => {
      for (const v of [
        { mode: 'center', margin: 8 },
        { mode: 'fill', width: 50 },
        { mode: 'percent', width: 120 },
        { mode: 'unknown' },
        {},
      ])
        expect(Value.Check(schema, v as unknown)).to.eql(false);
    });
  });
});
