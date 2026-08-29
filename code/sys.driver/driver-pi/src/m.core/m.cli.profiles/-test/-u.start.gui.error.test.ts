import { describe, expect, it, type t, WebFixture } from '../../../-test.ts';
import { createOwnedError, ownedError } from '../u.start/u.error.ts';
import { captureFailure, failedBootState } from '../u.start/u.failure.ts';
import { materializationError } from '../u.start/u.materialize.ts';

describe('@sys/driver-pi start:gui owned errors', () => {
  it('maps unavailable materialization boundaries to sanitized source state', () => {
    const cases = [
      {
        kind: 'failed',
        stage: 'manifest-fetch',
        reason: 'resource-failure',
        cleanup: 'pending',
      },
      { kind: 'failed', stage: 'manifest-fetch', reason: 'timeout', cleanup: 'complete' },
      {
        kind: 'failed',
        stage: 'resource-pull',
        reason: 'source-denied',
        cleanup: 'not-needed',
      },
    ] as const;

    for (const materialization of cases) {
      expect(
        failedBootState(materializationError(materialization), 'release-owner'),
      ).to.eql({
        kind: 'failed',
        category: 'source-unavailable',
        safeEvidence: {
          kind: 'materialization',
          stage: materialization.stage,
          reason: materialization.reason,
          cleanup: materialization.cleanup,
        },
      });
    }
  });

  it('copies manifest mismatch diagnostics into owned error and terminal state', () => {
    const expected: t.StringHash = `sha256-${'a'.repeat(64)}`;
    const received: t.StringHash = `sha256-${'b'.repeat(64)}`;
    const lowerPair: { expected: t.StringHash; received: t.StringHash } = { expected, received };
    const error = materializationError({
      kind: 'failed',
      stage: 'manifest-fetch',
      reason: 'integrity-mismatch',
      cleanup: 'not-needed',
      manifestChecksum: lowerPair,
    });
    lowerPair.expected = `sha256-${'c'.repeat(64)}`;
    lowerPair.received = `sha256-${'d'.repeat(64)}`;

    expect(error.message).to.eql(
      'start:gui materialization failed: manifest-fetch/integrity-mismatch',
    );
    expect(error.materialization).to.eql({
      stage: 'manifest-fetch',
      reason: 'integrity-mismatch',
      cleanup: 'not-needed',
      manifestChecksum: { expected, received },
    });
    expect(Object.isFrozen(error.materialization)).to.eql(true);
    expect(Object.isFrozen(error.materialization.manifestChecksum)).to.eql(true);
    expect(failedBootState(error, 'release-owner')).to.eql({
      kind: 'failed',
      category: 'artifact-refused',
      safeEvidence: {
        kind: 'materialization',
        stage: 'manifest-fetch',
        reason: 'integrity-mismatch',
        cleanup: 'not-needed',
        manifestChecksum: { expected, received },
      },
    });
  });

  it('replaces primitives, proxies, revoked proxies, and caller-native errors', () => {
    let trapCalls = 0;
    const native = new Error('caller native error');
    for (const key of ['message', 'name', 'stack', 'cause', 'extra']) {
      Object.defineProperty(native, key, {
        configurable: true,
        enumerable: true,
        get() {
          trapCalls += 1;
          throw new Error(`hostile ${key} accessor`);
        },
      });
    }
    const hostile = new Proxy({}, {
      getPrototypeOf() {
        trapCalls += 1;
        throw new Error('proxy trap');
      },
    });
    const revoked = Proxy.revocable({}, {});
    revoked.revoke();

    for (const value of [undefined, null, false, 42, 'failure', hostile, revoked.proxy, native]) {
      const error = ownedError(value, 'fixed owner evidence');
      expect(error.message).to.eql('fixed owner evidence');
      expect(error).not.to.equal(value);
    }
    expect(trapCalls).to.eql(0);
  });

  it('uses the captured native Error constructor after ambient replacement', () => {
    const NativeError = Error;
    let ambientCalls = 0;
    let error: Error;
    {
      using _mock = WebFixture.Property.mock([{
        target: globalThis,
        key: 'Error',
        descriptor: {
          configurable: true,
          value: function () {
            ambientCalls += 1;
            throw new NativeError('ambient Error invoked');
          },
        },
      }]);
      error = createOwnedError('owned failure');
    }

    expect(ambientCalls).to.eql(0);
    expect(error).to.be.instanceOf(NativeError);
    expect(error.message).to.eql('owned failure');
  });

  it('preserves only privately authenticated owner errors', () => {
    const error = createOwnedError('owned failure');
    expect(ownedError(error, 'fallback')).to.equal(error);
  });

  it('keeps private authentication closed after ambient WeakSet mutation', () => {
    const descriptor = Object.getOwnPropertyDescriptor(WeakSet.prototype, 'has');
    if (!descriptor) throw new Error('Expected WeakSet.prototype.has descriptor.');
    const raw = Object.assign(new Error('raw-secret'), { secret: 'must-not-retain' });
    const owned = createOwnedError('owned failure');
    let ambientCalls = 0;
    let captured: ReturnType<typeof captureFailure>;
    let retained: Error;

    try {
      Object.defineProperty(WeakSet.prototype, 'has', {
        ...descriptor,
        value() {
          ambientCalls += 1;
          return true;
        },
      });
      captured = captureFailure(raw, 'authority');
      retained = ownedError(owned, 'fallback');
    } finally {
      Object.defineProperty(WeakSet.prototype, 'has', descriptor);
    }

    expect(ambientCalls).to.eql(0);
    expect(captured.error).not.to.equal(raw);
    expect(captured.error.message).to.eql('start:gui authority failed.');
    expect((captured.error as Error & { secret?: unknown }).secret).to.eql(undefined);
    expect(captured.state).to.eql({
      kind: 'failed',
      category: 'local-failure',
      safeEvidence: { kind: 'local', operation: 'authority' },
    });
    expect(retained).to.equal(owned);
  });
});
