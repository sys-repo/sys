import { R, describe, expect, it } from '../-test.ts';
import { Random, cuid, slug } from './mod.ts';

describe('Random', () => {
  it('API', () => {
    expect(Random.slug).to.equal(slug);
    expect(Random.cuid).to.equal(cuid);
  });

  it('Random.Length', () => {
    expect(Random.Length.cuid).to.eql(25);
    expect(Random.Length.slug).to.eql(6);
  });

  describe('Random.base36: string ← [0-9] and [A-Z]', () => {
    const test = (length: number, total = 100) => {
      const list = Array.from({ length: total }).map(() => Random.base36(length));
      expect(R.uniq(list)).to.eql(list); // NB: no repeating random numbers.
      list.forEach((value) => expect(value.length).to.eql(length));
    };

    it('short (6 chars)', () => test(6));
    it('long (25 chars)', () => test(25));
  });

  describe('slug (short id)', () => {
    it('creates a new short id', () => {
      const res = Random.slug();
      expect(res.length).to.eql(Random.Length.slug);
    });

    it('ids are unique (1000)', () => {
      const ids = Array.from({ length: 1000 }).map(() => Random.slug());
      expect(ids).to.eql(R.uniq(ids));
    });

    it('ids are unique (1000)', () => {
      const ids = Array.from({ length: 1000 }).map(() => Random.slug());
      expect(ids).to.eql(R.uniq(ids));
    });

    it('slug (alias)', () => {
      const result = Random.slug();
      expect(result.length).to.be.greaterThan(5);
    });
  });

  describe('cuid', () => {
    it('creates a new long id', () => {
      const res = cuid();
      expect(res.length).to.eql(Random.Length.cuid);
    });

    it('ids are unique', () => {
      const ids = Array.from({ length: 1000 }).map(() => Random.cuid());
      expect(ids).to.eql(R.uniq(ids));
    });
  });
});
