import { type t, describe, expect, expectTypeOf, it } from '../../-test.ts';
import { Ops } from '../ops/mod.ts';

describe('Timecode: Ops', () => {
  type T = { name: string; flag?: boolean };
  const mapA: t.TimecodeMap<T> = {
    '00:05': { name: 'Cutaway', flag: true },
    '00:00': { name: 'Intro' },
    '00:20.250': { name: 'Punchline' },
  };

  describe('Ops.find', () => {
    it('returns the first matching entry by temporal order', () => {
      type Data = { name?: string; flag?: boolean };
      const map: t.TimecodeMap<Data> = {
        '00:05': { name: 'Cutaway', flag: true },
        '00:00': { name: 'Intro' },
        '00:20.250': { name: 'Punchline', flag: true },
      };

      const res = Ops.find(map, (e) => e.data.flag === true);
      expect(res?.tc).to.eql('00:05');
      expect(res?.ms).to.eql(5000);
      expect(res?.data).to.eql({ name: 'Cutaway', flag: true });

      // typing stays precise
      expectTypeOf(res).toEqualTypeOf<t.TimecodeEntry<Data> | undefined>();
    });

    it('mirrors Array.find semantics: <undefined> when no match', () => {
      const map: t.TimecodeMap<{ name: string }> = {
        '00:02': { name: 'A' },
        '00:04': { name: 'B' },
      };
      const res = Ops.find(map, (e) => e.data.name === 'Z');
      expect(res).to.eql(undefined);
    });

    it('handles empty maps', () => {
      const map: t.TimecodeMap<{ x: number }> = {};
      const res = Ops.find(map, () => true);
      expect(res).to.eql(undefined);
    });

    it('invokes predicate in sorted temporal order and with canonical entry shape', () => {
      const seen: t.TimecodeEntry<{ i: number }>[] = [];
      const map: t.TimecodeMap<{ i: number }> = {
        '00:03': { i: 3 },
        '00:01': { i: 1 },
        '00:02': { i: 2 },
      };

      const res = Ops.find(map, (e) => {
        seen.push(e);
        return e.data.i === 2;
      });

      // predicate saw entries in ms order: 1s, 2s, (stops before 3s because matched at 2s)
      expect(seen.map((e) => e.ms)).to.eql([1000, 2000]);

      // canonical entry shape
      expect(res?.tc).to.eql('00:02');
      expect(res?.ms).to.eql(2000);
      expect(res?.data).to.eql({ i: 2 });
    });

    it('does not mutate the input map', () => {
      const map: t.TimecodeMap<{ v: number }> = {
        '00:02': { v: 2 },
        '00:01': { v: 1 },
      };
      const before = { ...map };
      const sameRef = map;

      void Ops.find(map, (e) => e.data.v === 999);
      expect(map).to.equal(sameRef); // identity preserved
      expect(map).to.eql(before); //    structure preserved
    });
  });

  describe('Ops.findAtOrBefore', () => {
    it('undefined when target precedes first entry', () => {
      const res = Ops.findAtOrBefore(mapA, -0.1);
      expect(res).to.eql(undefined);
    });

    it('exact match', () => {
      const res = Ops.findAtOrBefore(mapA, 5.0);
      expect(res?.tc).to.eql('00:05');
      expect(res?.ms).to.eql(5000);
      expect(res?.data).to.eql({ name: 'Cutaway', flag: true });
      expectTypeOf(res).toEqualTypeOf<t.TimecodeEntry<T> | undefined>();
    });

    it('snap to latest <= target', () => {
      const res = Ops.findAtOrBefore(mapA, 6.1);
      expect(res?.tc).to.eql('00:05');
    });

    it('empty map', () => {
      const res = Ops.findAtOrBefore({}, 3);
      expect(res).to.eql(undefined);
    });
  });

  describe('Ops.neighbors', () => {
    it('prev undefined before first; next is first', () => {
      const { prev, next } = Ops.neighbors(mapA, 0.0);
      expect(prev).to.eql(undefined);
      expect(next?.tc).to.eql('00:05');
    });

    it('both sides around interior time', () => {
      const { prev, next } = Ops.neighbors(mapA, 5.001);
      expect(prev?.tc).to.eql('00:05');
      expect(next?.tc).to.eql('00:20.250');
    });

    it('after last: next undefined; prev is last', () => {
      const { prev, next } = Ops.neighbors(mapA, 999);
      expect(prev?.tc).to.eql('00:20.250');
      expect(next).to.eql(undefined);
    });

    it('empty map', () => {
      const { prev, next } = Ops.neighbors({}, 1);
      expect(prev).to.eql(undefined);
      expect(next).to.eql(undefined);
    });
  });

  describe('Ops.between', () => {
    it('[start,end) window', () => {
      const res = Ops.between(mapA, 0, 6);
      expect(res.map((e) => e.tc)).to.eql(['00:00', '00:05']);
    });

    it('start inclusive, end exclusive boundary', () => {
      const resA = Ops.between(mapA, 5, 20.25);
      const resB = Ops.between(mapA, 5, 20.249);
      expect(resA.map((e) => e.tc)).to.eql(['00:05']);
      expect(resB.map((e) => e.tc)).to.eql(['00:05']);
    });

    it('invalid range (start >= end) → []', () => {
      expect(Ops.between(mapA, 5, 5)).to.eql([]);
      expect(Ops.between(mapA, 6, 5)).to.eql([]);
    });

    it('empty map', () => {
      expect(Ops.between({}, 0, 10)).to.eql([]);
    });
  });

  describe('Ops.nearest', () => {
    it('returns n closest, sorted by proximity; ties by temporal order', () => {
      const res = Ops.nearest(mapA, 6, 2);
      // distance to 6s: 00:05 (1s), 00:20.250 (14.25s), 00:00 (6s) ⇒ order: 5s, 0s
      expect(res.map((e) => e.tc)).to.eql(['00:05', '00:00']);
    });

    it('n larger than size clamps to length', () => {
      const res = Ops.nearest(mapA, 1, 10);
      expect(res.length).to.eql(3);
    });

    it('n <= 0 yields []', () => {
      expect(Ops.nearest(mapA, 1, 0)).to.eql([]);
      expect(Ops.nearest(mapA, 1, -3)).to.eql([]);
    });

    it('empty map', () => {
      expect(Ops.nearest({}, 1, 3)).to.eql([]);
    });

    it('type surface', () => {
      const out = Ops.nearest(mapA, 5, 2);
      expectTypeOf(out).toEqualTypeOf<readonly t.TimecodeEntry<T>[]>();
    });
  });
});
