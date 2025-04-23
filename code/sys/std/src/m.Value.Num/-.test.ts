import { describe, expect, it } from '../-test.ts';
import { Value } from '../m.Value/mod.ts';
import { Num } from './mod.ts';

describe('Value.Num', () => {
  it('API', () => {
    expect(Value.Num).to.equal(Num);
  });

  describe('Number', () => {
    describe('round', () => {
      it('should round to no decimal places by default', () => {
        expect(Num.round(1.2345)).to.eql(1);
        expect(Num.round(1.5)).to.eql(2);
        expect(Num.round(1.4)).to.eql(1);
      });

      it('should round to the specified number of decimal places', () => {
        expect(Num.round(1.2345, 2)).to.eql(1.23);
        expect(Num.round(1.235, 2)).to.eql(1.24);
        expect(Num.round(1.2345, 3)).to.eql(1.235);
      });

      it('should handle negative precision correctly', () => {
        expect(Num.round(12345, -1)).to.eql(12350);
        expect(Num.round(12345, -2)).to.eql(12300);
      });

      it('should round negative numbers correctly', () => {
        expect(Num.round(-1.2345)).to.eql(-1);
        expect(Num.round(-1.5)).to.eql(-1);
        expect(Num.round(-1.51)).to.eql(-2);
        expect(Num.round(-1.4)).to.eql(-1);
        expect(Num.round(-1.2345, 2)).to.eql(-1.23);
      });

      it('should round zero correctly', () => {
        expect(Num.round(0)).to.eql(0);
        expect(Num.round(0.1234, 2)).to.eql(0.12);
        expect(Value.round(0, -1)).to.eql(0);
      });
    });
  });

  describe('Num.hash', () => {
    const test = (input: any, expected?: number) => {
      const res = Num.hash(input);
      if (expected != null) expect(res).to.eql(expected);
      if (expected == null) console.info(`Num.hash( ${input} ):`, res);
    };

    it('simple', () => {
      test('hello', 6927037667158);
      test('', 729279156);
      test(123, 8546431076729);
      test(true, 24057694676);
    });

    it('complex', () => {
      test({}, 15861746468527);
      test([], 8556010191289);
      test([123, true, 'foo', {}, []], 5994549667863);
      test(BigInt(0), 24057588158);
    });

    it('(nothing)', () => {
      test(null, 711079339769);
      test(undefined, 4721361581144);
    });
  });
});
