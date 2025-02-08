import { describe, expect, it } from '../-test.ts';
import { Id } from './m.Id.ts';

describe('Id', () => {
  describe('ctx (session)', () => {
    it('prefix', () => {
      const id = Id.ctx.create();
      expect(id.startsWith(Id.ctx.prefix)).to.eql(true);
    });

    it('unique', () => {
      const id1 = Id.ctx.create();
      const id2 = Id.ctx.create();
      expect(id1).to.not.eql(id2);
    });
  });

  describe('renderer', () => {
    it('prefix', () => {
      const id = Id.renderer.create();
      expect(id.startsWith(Id.renderer.prefix)).to.eql(true);
    });

    it('unique', () => {
      const id1 = Id.renderer.create();
      const id2 = Id.renderer.create();
      expect(id1).to.not.eql(id2);
    });
  });
});
