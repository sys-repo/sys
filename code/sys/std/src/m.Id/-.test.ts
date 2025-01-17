import { describe, expect, it } from '../-test.ts';

import { Id, cuid, slug } from './mod.ts';
import { R } from '../common.ts';

describe('Id', () => {
  it('display', () => {
    console.info(`slug: ${slug()}`);
    console.info(`cuid: ${cuid()}`);
  });

  describe('cuid', () => {
    it('creates a new long id', () => {
      const res = Id.cuid();
      expect(res.length).to.be.greaterThan(24);
    });

    it('ids are unique', () => {
      const ids = new Array(1000).map(() => Id.cuid());
      expect(ids.length).to.eql(R.uniq(ids).length);
    });

    it('function export', () => {
      expect(Id.cuid).to.equal(cuid);
    });

    it('Id.Is.cuid( )', () => {
      ['', true, 123, [], {}, null, undefined].forEach((v) => expect(Id.Is.cuid(v)).to.eql(false));
      new Array(50).forEach(() => {
        const cuid = Id.cuid();
        const slug = Id.slug();
        expect(Id.Is.cuid(cuid)).to.eql(true);
        expect(Id.Is.cuid(slug)).to.eql(false);
      });
    });
  });

  describe('slug (short id)', () => {
    it('creates a new short id', () => {
      const res = Id.slug();
      expect(res.length).to.be.greaterThan(5);
      expect(res.length).to.be.lessThan(10);
    });

    it('ids are unique (1000)', () => {
      const ids = new Array(1000).map(() => Id.slug());
      expect(ids.length).to.eql(R.uniq(ids).length);
    });

    it('ids are unique (1000)', () => {
      const ids = new Array(1000).map(() => Id.slug());
      expect(ids.length).to.eql(R.uniq(ids).length);
    });

    it('slug (alias)', () => {
      const result = Id.slug();
      expect(result.length).to.be.greaterThan(5);
    });

    it('function export', () => {
      expect(Id.slug).to.equal(slug);
    });

    it('Id.Is.slug( )', () => {
      ['', true, 123, [], {}, null, undefined].forEach((v) => expect(Id.Is.cuid(v)).to.eql(false));
      new Array(50).forEach(() => {
        const cuid = Id.cuid();
        const slug = Id.slug();
        expect(Id.Is.slug(cuid)).to.eql(false);
        expect(Id.Is.slug(slug)).to.eql(true);
      });
    });
  });

  describe('init (custom length)', () => {
    const custom = Id.init(8);

    it('generate', () => {
      expect(custom.generate().length).to.eql(8);
    });

    it('length === 8', () => {
      expect(custom.length).to.eql(8);
    });

    it('is (flag test)', () => {
      const id = custom.generate();
      expect(custom.is(id)).to.eql(true);
      expect(custom.is('.2345678')).to.eql(false);
      ['', true, 123, [], {}, null, undefined].forEach((v) => expect(custom.is(v)).to.eql(false));
    });
  });
});
