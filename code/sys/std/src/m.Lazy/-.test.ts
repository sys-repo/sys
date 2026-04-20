import { describe, expect, expectTypeOf, it } from '../-test.ts';
import { Lazy } from './mod.ts';
import { Rx } from '../m.Rx/mod.ts';

describe(`Lazy`, () => {
  it('API', async () => {
    const m = await import('@sys/std/lazy');
    expect(m.Lazy).to.equal(Lazy);
  });

  /**
   * Lazy:
   */
  describe('Lazy', () => {
    describe('Lazy.memo', () => {
      it('computes only once (lazy initialisation)', () => {
        let calls = 0;
        const cell = Lazy.memo(() => {
          calls += 1;
          return 42;
        });

        expect(calls).to.eql(0); // not computed yet

        expect(cell()).to.eql(42); // first compute
        expect(calls).to.eql(1);

        expect(cell()).to.eql(42); // memoised
        expect(calls).to.eql(1);
      });

      it('`.value` is equivalent to calling the function', () => {
        let calls = 0;
        const cell = Lazy.memo(() => {
          calls += 1;
          return 'hello';
        });

        expect(calls).to.eql(0);

        expect(cell.value).to.eql('hello');
        expect(calls).to.eql(1);

        expect(cell.value).to.eql('hello');
        expect(calls).to.eql(1);

        expect(cell()).to.eql('hello');
        expect(calls).to.eql(1);
      });

      it('reset() clears the memoised value', () => {
        let calls = 0;
        const cell = Lazy.memo(() => {
          calls += 1;
          return calls;
        });

        expect(cell()).to.eql(1);
        expect(calls).to.eql(1);

        // after reset, recomputes
        cell.reset();

        expect(cell()).to.eql(2);
        expect(calls).to.eql(2);
      });

      it('external reset$ trigger invalidates the memoised value', () => {
        const reset$ = Rx.subject<null>();
        let calls = 0;

        const cell = Lazy.memo(
          () => {
            calls += 1;
            return calls;
          },
          { reset$ },
        );

        expect(cell()).to.eql(1);
        expect(calls).to.eql(1);

        // external signal triggers reset
        reset$.next(null);

        expect(cell()).to.eql(2);
        expect(calls).to.eql(2);
      });

      it('option overload: passing reset$ directly works', () => {
        const reset$ = Rx.subject<void>();
        let calls = 0;

        const cell = Lazy.memo(
          () => {
            calls += 1;
            return calls;
          },
          reset$, // observable passed directly
        );

        expect(cell()).to.eql(1);
        expect(calls).to.eql(1);

        reset$.next();

        expect(cell()).to.eql(2);
        expect(calls).to.eql(2);
      });

      it('type inference enforces T correctly', () => {
        const cell = Lazy.memo(() => 123);

        // type-level check
        expectTypeOf(cell()).toEqualTypeOf<number>();
        expectTypeOf(cell.value).toEqualTypeOf<number>();

        // runtime confirmation
        expect(cell()).to.eql(123);
      });

      it('is callable and stable (identity check)', () => {
        const cell = Lazy.memo(() => true);

        // identity consistency
        const refA = cell;
        const refB = cell;

        expect(refA).to.equal(refB);

        // behaviour
        expect(cell()).to.eql(true);
        expect(cell.value).to.eql(true);
      });
    });
  });
});
