import { describe, expect, it } from '../../-test.ts';
import { Signal } from '../mod.ts';

describe('Signal.toObject', () => {
  const s = Signal.create;
  const toObject = Signal.toObject;

  /**
   * Pass-through for primitives (no wrapping, no cloning).
   */
  it('returns primitives unchanged', () => {
    expect(toObject(42)).to.eql(42);
    expect(toObject('foo')).to.eql('foo');
    expect(toObject(true)).to.eql(true);
    expect(toObject(null)).to.eql(null);
    expect(toObject(undefined)).to.eql(undefined);
  });

  /**
   * Unwraps a single `Signal` to its `.value`.
   */
  it('unwraps a lone signal', () => {
    const num = s(123);
    expect(toObject(num)).to.eql(123);
  });

  /**
   * Handles arrays, tuples, and deeply nested objects.
   */
  it('unwraps signals at any depth', () => {
    const input = {
      a: s(1),
      b: {
        c: s('x'),
        d: [s(true), 5] as const,
      },
      e: [1, s(2)],
    };

    const result = toObject(input);

    expect(result).to.deep.eql({
      a: 1,
      b: { c: 'x', d: [true, 5] },
      e: [1, 2],
    });
  });

  /**
   * JSON-safe snapshot: functions are redacted (never invoked or retained).
   */
  it('stringifies function values by default', () => {
    const fn = () => 'hi';
    const obj = { fn, val: s(10) };

    const out = toObject(obj) as { fn: unknown; val: number };

    expect(out.fn).to.eql('[function]'); // redacted placeholder
    expect(out.val).to.eql(10); // signal unwrapped
  });

  it('func=strip omits function values', () => {
    const fn = () => 'hi';
    const obj = { fn, val: s(10) };

    const out = toObject(obj, { func: 'strip' }) as Record<string, unknown>;
    expect('fn' in out).to.eql(false);
    expect(out.val).to.eql(10);

    const arr = toObject([fn, 1], { func: 'strip' }) as unknown[];
    expect(arr).to.eql([1]);
  });

  it('func=include keeps function values', () => {
    const fn = () => 'hi';
    const obj = { fn, val: s(10) };

    const out = toObject(obj, { func: 'include' }) as { fn: unknown; val: number };
    expect(out.fn).to.equal(fn);
    expect(out.val).to.eql(10);

    const arr = toObject([fn], { func: 'include' }) as unknown[];
    expect(arr[0]).to.equal(fn);
  });

  it('func boolean aliases map to strip/include', () => {
    const fn = () => 'hi';

    const outTrue = toObject({ fn }, { func: true }) as { fn: unknown };
    expect(outTrue.fn).to.equal(fn);

    const outFalse = toObject({ fn }, { func: false }) as Record<string, unknown>;
    expect('fn' in outFalse).to.eql(false);
  });

  /**
   * toObject is snapshot-style: it never mutates the input
   * and returns wholly new container objects.
   */
  it('does not mutate the original structure', () => {
    const src = { nested: { x: s(7) } };
    const snap = toObject(src);

    expect(snap).to.not.equal(src); // ← top-level object copy.
    expect(snap.nested).to.not.equal(src.nested); // ← deep copy.
    expect(snap.nested.x).to.equal(7);
  });

  /**
   * Accessors are skipped by default: getters are not invoked.
   * (Prevents re-entrancy into live handles during inspection.)
   */
  it('skips accessor properties (no getter invocation)', () => {
    let calls = 0;
    const obj = Object.defineProperties(
      {},
      {
        dangerous: {
          get: () => {
            calls += 1;
            return 123;
          },
          enumerable: true,
        },
        safe: { value: s(1), enumerable: true },
      },
    );

    const out = toObject(obj) as Record<string, unknown>;

    expect(calls).to.eql(0); // getter never called
    expect('dangerous' in out).to.eql(false); // accessor omitted
    expect(out.safe).to.eql(1);
  });

  /**
   * Cycle guard: circular references are represented, not traversed.
   */
  it('guards against cycles', () => {
    const a: any = {};
    a.self = a;
    const out = toObject(a);
    expect(out.self).to.eql('[circular]');
  });

  /**
   * Depth guard: very deep structures are bounded.
   */
  it('limits recursion depth', () => {
    const deep = (n: number): any => (n === 0 ? { leaf: s('ok') } : { n, next: deep(n - 1) });
    const input = deep(8);
    const out = toObject(input);

    // We don't assert exact shape at max depth; only that a limit placeholder appears somewhere.
    // Walk down until we encounter the depth sentinel.
    let cursor: any = out;
    let seenSentinel = false;
    for (let i = 0; i < 10 && cursor; i++) {
      if (cursor === '[max-depth]') {
        seenSentinel = true;
        break;
      }
      cursor = cursor.next;
    }
    expect(seenSentinel).to.eql(true);
  });
});
