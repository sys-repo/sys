import { describe, expect, it, type t } from '../../../-test.ts';
import { snapshotAuthorityEvidence } from '../u.start/u.authority.ts';
import { createOwnedError, ownedError } from '../u.start/u.error.ts';
import { captureFailure, failedBootState, generationOpenError } from '../u.start/u.failure.ts';
import { materializationError } from '../u.start/u.failure.materialization.ts';
import { AUTHORITY_LIMITS } from '../u.start/u.limits.ts';

describe('@sys/driver-pi start:gui errors', () => {
  it('copies bounded development authority and refuses unsafe path evidence', () => {
    const expectedPkg = { name: '@sys/driver-pi', version: '1.0.0' };
    const source = {
      kind: 'development',
      dir: '/tmp/driver-pi-authority',
      integrity: `sha256-${'a'.repeat(64)}`,
      expectedPkg,
    };
    const snapshot = snapshotAuthorityEvidence(source);
    source.dir = '/tmp/changed';
    expectedPkg.name = '@other/driver-pi';

    expect(snapshot.kind).to.eql('valid');
    if (snapshot.kind !== 'valid') throw new Error('Expected valid development authority.');
    expect(snapshot.authority).to.include({
      kind: 'development',
      dir: '/tmp/driver-pi-authority',
    });
    expect(snapshot.authority.expectedPkg).to.eql({
      name: '@sys/driver-pi',
      version: '1.0.0',
    });
    expect(Object.isFrozen(snapshot.authority)).to.eql(true);
    expect(Object.isFrozen(snapshot.authority.expectedPkg)).to.eql(true);

    for (
      const dir of [
        '/tmp/driver-pi\ncontrol',
        `/${'a'.repeat(AUTHORITY_LIMITS.developmentDir)}`,
      ]
    ) {
      const refused = snapshotAuthorityEvidence({ ...source, dir });
      expect(refused.kind).to.eql('invalid');
      if (refused.kind !== 'invalid') throw new Error('Expected invalid development authority.');
      expect(refused.error.message).to.eql('Invalid start:gui development directory.');
    }
  });

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
      expect(failedBootState(materializationError(materialization), 'release-owner')).to.eql({
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

  it('maps outer Generation failure to release-owner evidence only', () => {
    const error = generationOpenError({
      kind: 'failed',
      phase: 'store',
      reason: 'execution-failure',
      ownership: 'not-acquired',
    });

    expect(error.message).to.eql('start:gui release-owner failed.');
    expect(failedBootState(error, 'release-owner')).to.eql({
      kind: 'failed',
      category: 'local-failure',
      safeEvidence: { kind: 'local', operation: 'release-owner' },
    });
    expect((error as Error & { materialization?: unknown }).materialization).to.eql(undefined);
  });

  it('authenticates outer Generation cancellation without exposing lower ownership', () => {
    const error = generationOpenError({
      kind: 'failed',
      phase: 'store',
      reason: 'cancelled',
      ownership: 'pending',
    });

    expect(error.message).to.eql('start:gui generation opening cancelled.');
    expect(failedBootState(error, 'release-owner')).to.eql({
      kind: 'failed',
      category: 'cancelled',
      safeEvidence: { kind: 'cancellation' },
    });
    expect((error as Error & { ownership?: unknown }).ownership).to.eql(undefined);
  });

  it('copies manifest mismatch diagnostics into owned immutable evidence', () => {
    const expected = `sha256-${'a'.repeat(64)}` as t.StringHash;
    const received = `sha256-${'b'.repeat(64)}` as t.StringHash;
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
  });

  it('sanitizes unowned failures while retaining package-owned errors', () => {
    const raw = Object.assign(new Error('raw-secret'), { secret: 'must-not-retain' });
    const captured = captureFailure(raw, 'authority');
    const owned = createOwnedError('owned failure');

    expect(captured.error).not.to.equal(raw);
    expect(captured.error.message).to.eql('start:gui authority failed.');
    expect((captured.error as Error & { secret?: unknown }).secret).to.eql(undefined);
    expect(ownedError(owned, 'fallback')).to.equal(owned);
  });
});
