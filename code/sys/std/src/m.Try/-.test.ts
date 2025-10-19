import { type t, describe, expect, expectTypeOf, it } from '../-test.ts';
import { Try } from './mod.ts';

describe('Try', () => {
  describe('Try.catch (sync)', () => {
    it('returns {ok:true,data} for successful sync thunks', () => {
      const r = Try.catch(() => 42);
      expect(r.ok).to.eql(true);
      if (r.ok) {
        expect(r.data).to.eql(42);
        expect(r.error).to.eql(undefined);
      }
    });

    it('returns {ok:false,error} for thrown sync errors (Error)', () => {
      const err = new Error('boom');
      const r = Try.catch(() => {
        throw err;
      });
      expect(r.ok).to.eql(false);
      if (!r.ok) {
        expect(r.error).to.be.instanceOf(Error);
        expect(r.error.message).to.eql('boom');
      }
    });

    it('returns {ok:false,error} for thrown non-Error values (coerced)', () => {
      const r = Try.catch(() => {
        throw 'boom';
      }); // string cause
      expect(r.ok).to.eql(false);
      if (!r.ok) {
        expect(r.error).to.be.instanceOf(Error);
        expect(r.error.message).to.eql('boom');
      }
    });

    it('typing: sync overload yields TryResult<T> (no Promise)', () => {
      const r = Try.catch(() => 123);
      expectTypeOf(r).toEqualTypeOf<t.TryResult<number>>();
    });
  });

  describe('Try.catch (async)', () => {
    it('returns Promise<{ok:true,data}> for successful async thunks', async () => {
      const r = await Try.catch(async () => 7);
      expect(r.ok).to.eql(true);
      if (r.ok) {
        expect(r.data).to.eql(7);
        expect(r.error).to.eql(undefined);
      }
    });

    it('returns Promise<{ok:false,error}> for rejected async thunks (Error)', async () => {
      const err = new Error('nope');
      const r = await Try.catch(async () => {
        throw err;
      });
      expect(r.ok).to.eql(false);
      if (!r.ok) {
        expect(r.error).to.be.instanceOf(Error);
        expect(r.error.message).to.eql('nope');
      }
    });

    it('returns Promise<{ok:false,error}> for rejected async thunks (non-Error)', async () => {
      const r = await Try.catch(async () => {
        throw 123;
      });
      expect(r.ok).to.eql(false);
      if (!r.ok) {
        expect(r.error).to.be.instanceOf(Error);
        expect(r.error.message).to.eql('123');
      }
    });

    it('typing: async overload yields Promise<TryResult<T>>', () => {
      const r = Try.catch(async () => 'x');
      expectTypeOf(r).toEqualTypeOf<Promise<t.TryResult<string>>>();
    });
  });

  describe('Try.catch (thenables)', () => {
    it('treats thenable objects as promises (resolve)', async () => {
      const thenable = { then: (res: (v: number) => void) => res(99) };
      const r = await Try.catch(() => thenable);
      expect(r.ok).to.eql(true);
      if (r.ok) expect(r.data).to.eql(99);
    });

    it('treats thenable objects as promises (reject)', async () => {
      const thenable = { then: (_: unknown, rej: (e: unknown) => void) => rej('bad') };
      const r = await Try.catch(() => thenable);
      expect(r.ok).to.eql(false);
      if (!r.ok) {
        expect(r.error).to.be.instanceOf(Error);
        expect(r.error.message).to.eql('bad');
      }
    });
  });

  describe('Try.catch (edge cases)', () => {
    it('preserves undefined data for sync success', () => {
      const r = Try.catch(() => undefined);
      expect(r.ok).to.eql(true);
      if (r.ok) expect(r.data).to.eql(undefined);
    });

    it('handles async functions that return a native Promise', async () => {
      const r = await Try.catch(() => Promise.resolve('ok'));
      expect(r.ok).to.eql(true);
      if (r.ok) expect(r.data).to.eql('ok');
    });
  });
});
