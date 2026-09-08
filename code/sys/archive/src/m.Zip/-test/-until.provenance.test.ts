import { describe, expect, it, type t } from '../../-test.ts';
import { Zip } from '../mod.ts';
import { failure } from '../u/u.failure.ts';
import { openOptions, workOptions } from '../u/u.input.ts';

const MAX_ERROR_CHARS = 11;
const owners = [
  {
    operation: 'open',
    call: (until: unknown) =>
      openOptions({
        timeout: 1000,
        until,
        limits: { maxErrorChars: MAX_ERROR_CHARS },
      }),
  },
  {
    operation: 'test',
    call: (until: unknown) => workOptions({ timeout: 1000, until }, MAX_ERROR_CHARS),
  },
  {
    operation: 'extract',
    call: (until: unknown) => workOptions({ timeout: 1000, until }, MAX_ERROR_CHARS, 'extract'),
  },
] as const;

describe('Zip: cancellation exception provenance', () => {
  for (const owner of owners) {
    it(`${owner.operation}: caller exception → original nested cause`, () => {
      const sentinel = new Error('getter sentinel');
      const lookalike = new TypeError('Invalid UntilInput');
      for (const cause of [sentinel, lookalike, undefined]) {
        const error = rejection(() =>
          owner.call({
            get disposed() {
              throw cause;
            },
          })
        );
        expectOuter(error, owner.operation);
        const inner = authenticated(error.cause);
        expect(inner.operation).to.equal('open');
        expect(inner.kind).to.equal('invalid-options');
        expect(inner.message).to.equal('Invalid ZIP operation options');
        expect(inner.cause).to.equal(cause);
        expect(Object.hasOwn(inner, 'cause')).to.equal(cause !== undefined);
      }
    });

    it(`${owner.operation}: authenticated failure → direct cause with context intact`, () => {
      const sentinel = failure('extract', 'sink-failure', {
        entryIndex: 7,
        cause: new Error('sink sentinel'),
      });
      const error = rejection(() =>
        owner.call({
          get disposed() {
            throw sentinel;
          },
        })
      );
      expectOuter(error, owner.operation);
      expect(error.cause).to.equal(sentinel);
      const inner = authenticated(error.cause);
      expect(inner.kind).to.equal('sink-failure');
      expect(inner.operation).to.equal('extract');
      expect(inner.entryIndex).to.equal(7);
    });

    it(`${owner.operation}: admission refusal → domain error without std leakage`, () => {
      const error = rejection(() => owner.call([null]));
      expectOuter(error, owner.operation);
      const inner = authenticated(error.cause);
      expect(inner.kind).to.equal('invalid-options');
      expect(Object.hasOwn(inner, 'cause')).to.equal(false);
    });
  }

  it('does not interpret an inherited TypeError cause as caller provenance', () => {
    const previous = Object.getOwnPropertyDescriptor(TypeError.prototype, 'cause');
    const sentinel = failure('extract', 'sink-failure', { entryIndex: 7 });
    let reads = 0;
    Object.defineProperty(TypeError.prototype, 'cause', {
      configurable: true,
      get() {
        reads++;
        return sentinel;
      },
    });
    try {
      const error = rejection(() => owners[0].call([null]));
      expect(authenticated(error.cause).kind).to.equal('invalid-options');
      expect(reads).to.equal(0);
    } finally {
      if (previous) Object.defineProperty(TypeError.prototype, 'cause', previous);
      else Reflect.deleteProperty(TypeError.prototype, 'cause');
    }
  });

  it('preserves hostile exception identity without inspection or formatting', () => {
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
      const error = rejection(() =>
        owners[0].call({
          get disposed() {
            throw cause;
          },
        })
      );
      expect(authenticated(error.cause).cause === cause).to.equal(true);
    }
    expect(calls).to.equal(0);
  });
});

function expectOuter(error: t.Zip.Failure.Error, operation: t.Zip.Operation) {
  expect(error.operation).to.equal(operation);
  expect(error.kind).to.equal('invalid-options');
  expect(error.message).to.equal('Invalid ZIP');
  expect(error.message.length).to.be.at.most(MAX_ERROR_CHARS);
}

function authenticated(error: unknown): t.Zip.Failure.Error {
  expect(Zip.Is.failure(error)).to.equal(true);
  if (!Zip.Is.failure(error)) throw new Error('Expected authenticated ZIP failure.');
  expect(error.name).to.equal('ZipError');
  expect(Object.isFrozen(error)).to.equal(true);
  return error;
}

function rejection(action: () => unknown): t.Zip.Failure.Error {
  let error: unknown;
  try {
    action();
  } catch (cause) {
    error = cause;
  }
  return authenticated(error);
}
