import { describe, expect, Fs, Is, it, type t } from '../common.ts';
import type { Start } from '../../src/m.cli/m.profiles/u.start/u.gui/t.ts';
import { START_GUI_SERVICE } from '../../src/m.cli/m.profiles/u/u.start.gui.service.ts';
import {
  cleanupRoot,
  DIST_DIR,
  evidenceAt,
  generationExists,
  loadCandidate,
  resetStore,
  runSession,
  runWithCleanup,
  startLocalServe,
  startServeTrap,
  startTamperedTransport,
  temporaryRoot,
} from './u.fixture.start.gui.release.local.ts';

type ReleaseSession = Awaited<ReturnType<typeof runSession>>;

const PACKAGE_ROOT = Fs.resolve(import.meta.dirname ?? '.', '../..');
const WORKSPACE_ROOT = Fs.resolve(PACKAGE_ROOT, '../../..');
const TEST_TMP_ROOT = Fs.join(PACKAGE_ROOT, '.tmp');
const EVIDENCE_RELATIVE_PATH = 'src/m.cli/m.profiles/u/u.start.gui.service.evidence.ts';
const EVIDENCE_PATH = Fs.join(PACKAGE_ROOT, EVIDENCE_RELATIVE_PATH);
const PROTECTED_WRITES = [
  DIST_DIR,
  Fs.join(PACKAGE_ROOT, '.pi'),
  Fs.join(WORKSPACE_ROOT, '.pi'),
  EVIDENCE_PATH,
] as const;

describe('driver-pi local GUI release evidence', () => {
  it('denies protected writes, wildcard bind, ambient execution, and the operator source port', async () => {
    expect(await permissionState({ name: 'write', path: TEST_TMP_ROOT })).to.eql('granted');
    for (const path of PROTECTED_WRITES) {
      expect(await permissionState({ name: 'write', path })).to.eql('denied');
    }
    expect(await permissionState({ name: 'env', variable: 'DENO_DIR' })).to.eql('denied');
    expect(await permissionState({ name: 'run', command: Deno.execPath() })).to.eql('denied');
    expect(await permissionState({ name: 'net', host: '0.0.0.0' })).to.eql('denied');
    const sourcePort = await permissionState({ name: 'net', host: '127.0.0.1:8080' });
    expect(sourcePort).to.eql('denied');
  });

  it('preserves primary failure when cleanup also rejects', async () => {
    const primary = new Error('primary');
    const cleanup = new Error('cleanup');
    const thrown = await rejectionOf(() =>
      runWithCleanup(
        () => Promise.reject(primary),
        () => Promise.reject(cleanup),
      )
    );
    expect(thrown).to.be.instanceOf(SuppressedError);
    expect((thrown as SuppressedError).error).to.equal(primary);
    expect((thrown as SuppressedError).suppressed).to.equal(cleanup);
  });

  it('admits the pinned saved candidate and package identity', async () => {
    const candidate = await loadCandidate();
    expect(candidate.dist.pkg).to.eql(START_GUI_SERVICE.source.expectedPkg);
  });

  it('performs cold acquisition, warm offline reuse, and stopped-serve refusal after reset', async () => {
    const root = await temporaryRoot('driver-pi.release-local.cold-warm.');
    let source: Awaited<ReturnType<typeof startLocalServe>> | undefined;
    await runWithCleanup(
      async () => {
        source = await startLocalServe(DIST_DIR);
        const evidence = evidenceAt(source.origin);
        const cold = await runSession(root, evidence);
        expect(cold.state.kind).to.eql('ready');
        expect(cold.appStarts).to.eql(1);
        expect(cold.bootstrapStatus).to.eql(303);
        expect(cold.applicationStatus).to.eql(200);
        expect(cold.location).to.match(/^http:\/\/127\.0\.0\.1:\d+$/);
        expect(cold.body.length).to.be.greaterThan(0);
        expect(cold.outcome).to.eql('external-cancellation');
        expect(cold.error).to.eql(undefined);

        await source.close();
        const trap = startServeTrap(evidence);
        const warm = await runWithCleanup(
          async () => {
            const result = await runSession(root, evidence);
            expect(trap.requests).to.eql(0);
            return result;
          },
          () => trap.close(),
        );
        expect(warm.state.kind).to.eql('ready');
        expect(warm.appStarts).to.eql(1);
        expect(warm.bootstrapStatus).to.eql(303);
        expect(warm.applicationStatus).to.eql(200);
        expect(warm.body).to.eql(cold.body);
        expect(warm.outcome).to.eql('external-cancellation');
        expect(warm.error).to.eql(undefined);

        await resetStore(root);
        const unavailable = await runSession(root, evidence);
        expect(unavailable.state).to.eql({
          kind: 'failed',
          category: 'source-unavailable',
          safeEvidence: {
            kind: 'materialization',
            stage: 'manifest-fetch',
            reason: 'resource-failure',
            cleanup: 'not-needed',
          },
        });
        expect(unavailable.appStarts).to.eql(0);
        expect(unavailable.bootstrapStatus).to.eql(200);
        expect(unavailable.applicationStatus).to.eql(undefined);
        expect(unavailable.location).to.eql(undefined);
        expect(unavailable.statusBody).not.to.contain('start:gui:reset');
        expect(unavailable.outcome).to.eql('failed');
        expect(unavailable.error).to.eql(undefined);
      },
      async () => {
        if (source) await source.close();
      },
      () => cleanupRoot(root),
    );
  });

  it('refuses changed transported manifest bytes without promotion or application-host execution', async () => {
    const root = await temporaryRoot('driver-pi.release-local.manifest-tamper.');
    let transport: Awaited<ReturnType<typeof startTamperedTransport>> | undefined;
    await runWithCleanup(
      async () => {
        transport = await startTamperedTransport('manifest');
        const session = await runSession(root, transport.source);
        const safeEvidence = await expectArtifactRefusal(session, root, transport.source.integrity);
        if (
          safeEvidence.stage !== 'manifest-fetch' ||
          safeEvidence.reason !== 'integrity-mismatch' ||
          !safeEvidence.manifestChecksum
        ) throw new Error('Expected manifest checksum mismatch evidence.');
        expect(safeEvidence.manifestChecksum.expected).to.eql(transport.source.integrity);
        expect(safeEvidence.manifestChecksum.received).not.to.eql(transport.source.integrity);
      },
      async () => {
        if (transport) await transport.close();
      },
      () => cleanupRoot(root),
    );
  });

  it('refuses changed transported asset bytes without promotion or application-host execution', async () => {
    const root = await temporaryRoot('driver-pi.release-local.asset-tamper.');
    let transport: Awaited<ReturnType<typeof startTamperedTransport>> | undefined;
    await runWithCleanup(
      async () => {
        transport = await startTamperedTransport('asset');
        const session = await runSession(root, transport.source);
        const safeEvidence = await expectArtifactRefusal(session, root, transport.source.integrity);
        expect(safeEvidence.manifestChecksum).to.eql(undefined);
      },
      async () => {
        if (transport) await transport.close();
      },
      () => cleanupRoot(root),
    );
  });
});

async function expectArtifactRefusal(
  session: ReleaseSession,
  root: t.StringAbsoluteDir,
  integrity: t.StringHash,
): Promise<Start.Gui.Failure.MaterializationEvidence> {
  expect(session.state.kind).to.eql('failed');
  if (session.state.kind !== 'failed') throw new Error('Expected artifact refusal.');
  expect(session.state.category).to.eql('artifact-refused');
  const evidence = session.state.safeEvidence;
  if (evidence.kind !== 'materialization') {
    throw new Error('Expected artifact materialization evidence.');
  }
  expect(session.appStarts).to.eql(0);
  expect(session.bootstrapStatus).to.eql(200);
  expect(session.applicationStatus).to.eql(undefined);
  expect(session.location).to.eql(undefined);
  expect(session.outcome).to.eql('failed');
  expect(session.error).to.eql(undefined);
  expect(await generationExists(root, integrity)).to.eql(false);
  return evidence;
}

async function rejectionOf(operation: () => Promise<unknown>): Promise<Error> {
  try {
    await operation();
  } catch (cause) {
    return Is.error(cause) ? cause : new Error(String(cause));
  }
  throw new Error('Expected rejection.');
}

async function permissionState(
  descriptor: Deno.PermissionDescriptor,
): Promise<PermissionState> {
  return (await Deno.permissions.query(descriptor)).state;
}
