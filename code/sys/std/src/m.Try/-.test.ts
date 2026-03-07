import { type t, describe, expect, expectTypeOf, it } from '../-test.ts';
import { Try } from './mod.ts';

describe('Try', () => {
  /**
   * Sync: Try.run(() => T) → TryRunResult<T>
   */
  describe('Try.run (sync)', () => {
    it('returns {ok:true,data} for successful sync thunks', () => {
      const runResult = Try.run(() => 42);
      const r = runResult.result;

      expect(r.ok).to.eql(true);
      if (r.ok) {
        expect(r.data).to.eql(42);
        expect(r.error).to.eql(undefined);
      }
    });

    it('returns {ok:false,error} for thrown sync errors (Error)', () => {
      const err = new Error('boom');

      const fail = (): number => {
        throw err;
      };

      const runResult = Try.run(fail);
      const r = runResult.result;

      expect(r.ok).to.eql(false);
      if (!r.ok) {
        expect(r.error).to.be.instanceOf(Error);
        expect(r.error.message).to.eql('boom');
      }
    });

    it('returns {ok:false,error} for thrown non-Error values (coerced)', () => {
      const fail = (): number => {
        throw 'boom';
      }; // string cause

      const runResult = Try.run(fail);
      const r = runResult.result;

      expect(r.ok).to.eql(false);
      if (!r.ok) {
        expect(r.error).to.be.instanceOf(Error);
        expect(r.error.message).to.eql('boom');
      }
    });

    it('preserves undefined data for sync success', () => {
      const fn = (): undefined => undefined;
      const runResult = Try.run(fn);
      const r = runResult.result;

      expect(r.ok).to.eql(true);
      if (r.ok) expect(r.data).to.eql(undefined);
    });

    it('typing: run(sync) returns TryRunResult<T>', () => {
      const runResult = Try.run(() => 123);
      expectTypeOf(runResult).toEqualTypeOf<t.TryRunResult<number>>();
      expectTypeOf(runResult.result).toEqualTypeOf<t.TryResult<number>>();
    });
  });

  /**
   * Async: Try.run(async () => T) → Promise<TryRunResult<T>>
   */
  describe('Try.run (async)', () => {
    it('wraps successful async thunks', async () => {
      const runResult = await Try.run(async () => 7);
      const r = runResult.result;

      expect(r.ok).to.eql(true);
      if (r.ok) {
        expect(r.data).to.eql(7);
        expect(r.error).to.eql(undefined);
      }
    });

    it('wraps thrown async errors (Error) as TryFail', async () => {
      const err = new Error('nope');

      const runResult = await Try.run(async () => {
        throw err;
      });
      const r = runResult.result;

      expect(r.ok).to.eql(false);
      if (!r.ok) {
        expect(r.error).to.be.instanceOf(Error);
        expect(r.error.message).to.eql('nope');
      }
    });

    it('wraps thrown async errors (non-Error) as coerced Error', async () => {
      const runResult = await Try.run(async () => {
        throw 123;
      });
      const r = runResult.result;

      expect(r.ok).to.eql(false);
      if (!r.ok) {
        expect(r.error).to.be.instanceOf(Error);
        expect(r.error.message).to.eql('123');
      }
    });

    it('typing: run(async) returns Promise<TryRunResult<T>>', () => {
      // Use assignment instead of expectTypeOf to avoid generic constraint weirdness.
      const _r: Promise<t.TryRunResult<string>> = Try.run(async () => 'x');
      void _r;
    });
  });

  /**
   * Handler: TryRunResult<T>.catch(handler) – sync cases.
   */
  describe('Try.run.catch handler (sync)', () => {
    it('does not invoke catch handler on success', () => {
      let caught: Error | undefined;

      const runResult = Try.run(() => 1);
      const r = runResult.catch((err: Error) => {
        caught = err;
      });

      expect(r.ok).to.eql(true);
      if (r.ok) expect(r.data).to.eql(1);
      expect(caught).to.eql(undefined);
    });

    it('invokes catch handler on failure and returns the same TryResult', () => {
      const err = new Error('fail');
      let caught: Error | undefined;

      const fail = (): number => {
        throw err;
      };

      const runResult = Try.run(fail);
      const r = runResult.catch((e: Error) => {
        caught = e;
      });

      expect(r.ok).to.eql(false);
      if (!r.ok) {
        expect(r.error).to.be.instanceOf(Error);
        expect(r.error.message).to.eql('fail');
      }

      expect(caught).to.be.instanceOf(Error);
      expect(caught && caught.message).to.eql('fail');
    });

    it('catch handler sees coerced Error for non-Error throws', () => {
      let caught: Error | undefined;

      const fail = (): number => {
        throw 123;
      };

      const runResult = Try.run(fail);
      const r = runResult.catch((e: Error) => {
        caught = e;
      });

      expect(r.ok).to.eql(false);
      if (!r.ok) {
        expect(r.error).to.be.instanceOf(Error);
        expect(r.error.message).to.eql('123');
      }

      expect(caught).to.be.instanceOf(Error);
      expect(caught && caught.message).to.eql('123');
    });

    it('typing: catch(sync) returns TryResult<T>', () => {
      const runResult = Try.run(() => 'x');
      const r = runResult.catch((_e: Error) => {
        // no-op
      });
      expectTypeOf(r).toEqualTypeOf<t.TryResult<string>>();
    });
  });

  /**
   * Handler: TryRunResult<T>.catch(handler) – async cases.
   */
  describe('Try.run.catch handler (async)', () => {
    it('does not invoke catch handler on async success', async () => {
      let caught: Error | undefined;

      const runResult = await Try.run(async () => 1);
      const r = runResult.catch((err: Error) => {
        caught = err;
      });

      expect(r.ok).to.eql(true);
      if (r.ok) expect(r.data).to.eql(1);
      expect(caught).to.eql(undefined);
    });

    it('invokes catch handler on async failure and returns the same TryResult', async () => {
      const err = new Error('fail');
      let caught: Error | undefined;

      const runResult = await Try.run(async () => {
        throw err;
      });
      const r = runResult.catch((e: Error) => {
        caught = e;
      });

      expect(r.ok).to.eql(false);
      if (!r.ok) {
        expect(r.error).to.be.instanceOf(Error);
        expect(r.error.message).to.eql('fail');
      }

      expect(caught).to.be.instanceOf(Error);
      expect(caught && caught.message).to.eql('fail');
    });

    it('catch handler sees coerced Error for non-Error async throws', async () => {
      let caught: Error | undefined;

      const runResult = await Try.run(async () => {
        throw 123;
      });
      const r = runResult.catch((e: Error) => {
        caught = e;
      });

      expect(r.ok).to.eql(false);
      if (!r.ok) {
        expect(r.error).to.be.instanceOf(Error);
        expect(r.error.message).to.eql('123');
      }

      expect(caught).to.be.instanceOf(Error);
      expect(caught && caught.message).to.eql('123');
    });

    it('typing: catch(async) still returns TryResult<T>', async () => {
      const runResult = await Try.run(async () => 'x');
      const r = runResult.catch((_e: Error) => {
        // no-op
      });

      const _r: t.TryResult<string> = r;
      void _r;
    });
  });
});
