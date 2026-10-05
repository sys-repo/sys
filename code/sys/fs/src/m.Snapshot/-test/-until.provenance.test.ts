import { describe, expect, it, type t } from '../../-test.ts';
import { Snapshot } from '../mod.ts';
import { failure } from '../u/u.failure.ts';
import { snapshotOptions } from '../u/u.input.ts';

const options = { root: '/snapshot', path: '/snapshot/file', maxBytes: 1, timeout: 1000 };

describe('Fs.Snapshot: cancellation exception provenance', () => {
  it('authenticated getter failure → same failure, kind and identity', () => {
    const sentinel = failure('missing');
    const error = rejection({
      get disposed() {
        throw sentinel;
      },
    });
    expect(error).to.equal(sentinel);
    expect(error.kind).to.equal('missing');
    expect(error.message).to.equal('Filesystem snapshot source is missing');
  });

  it('other getter exceptions → bounded invalid-options without a cause', () => {
    const forged = Object.assign(new Error('forged'), {
      name: 'FsSnapshotError',
      operation: 'file',
      kind: 'missing',
    });
    const causes = [
      new Error('getter sentinel'),
      new TypeError('Invalid UntilInput'),
      undefined,
      forged,
    ];
    for (const cause of causes) {
      const error = rejection({
        get disposed() {
          throw cause;
        },
      });
      expect(error.kind).to.equal('invalid-options');
      expect(error.message).to.equal('Invalid filesystem snapshot options');
      expect(Object.hasOwn(error, 'cause')).to.equal(false);
    }
  });

  it('admission refusal → authenticated invalid-options without std leakage', () => {
    const error = rejection([null]);
    expect(error.kind).to.equal('invalid-options');
    expect(Object.hasOwn(error, 'cause')).to.equal(false);
  });

  it('does not authenticate an inherited TypeError cause', () => {
    const previous = Object.getOwnPropertyDescriptor(TypeError.prototype, 'cause');
    const sentinel = failure('missing');
    let reads = 0;
    Object.defineProperty(TypeError.prototype, 'cause', {
      configurable: true,
      get() {
        reads++;
        return sentinel;
      },
    });
    try {
      expect(rejection([null]).kind).to.equal('invalid-options');
      expect(reads).to.equal(0);
    } finally {
      if (previous) Object.defineProperty(TypeError.prototype, 'cause', previous);
      else Reflect.deleteProperty(TypeError.prototype, 'cause');
    }
  });

  it('does not inspect or format unauthenticated hostile exceptions', () => {
    let calls = 0;
    const trap = () => {
      calls++;
      throw new Error('must not inspect caller exception');
    };
    const proxy = new Proxy({}, { get: trap, getPrototypeOf: trap, has: trap });
    const hostile = Object.defineProperties({}, {
      name: { get: trap },
      message: { get: trap },
      cause: { get: trap },
      toString: { value: trap },
      [Symbol.toPrimitive]: { value: trap },
    });
    for (const cause of [proxy, hostile]) {
      const error = rejection({
        get disposed() {
          throw cause;
        },
      });
      expect(error.kind).to.equal('invalid-options');
    }
    expect(calls).to.equal(0);
  });
});

function rejection(until: unknown): t.Snapshot.Failure.Error {
  let error: unknown;
  try {
    snapshotOptions({ ...options, until });
  } catch (cause) {
    error = cause;
  }
  expect(Snapshot.Is.failure(error)).to.equal(true);
  if (!Snapshot.Is.failure(error)) throw new Error('Expected authenticated snapshot failure.');
  expect(error.name).to.equal('FsSnapshotError');
  expect(error.operation).to.equal('file');
  expect(error.message.length).to.be.at.most(256);
  expect(Object.isFrozen(error)).to.equal(true);
  return error;
}
