import { describe, expect, Fs, it, type t } from '../common.ts';
import { START_GUI_SERVICE } from '../../src/m.core/m.cli.profiles/u/u.start.gui.service.ts';
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

const PACKAGE_ROOT = Fs.resolve(import.meta.dirname ?? '.', '../..');
const WORKSPACE_ROOT = Fs.resolve(PACKAGE_ROOT, '../../..');
const TEST_TMP_ROOT = Fs.join(PACKAGE_ROOT, '.tmp');
const PROTECTED_WRITES = [
  DIST_DIR,
  Fs.join(PACKAGE_ROOT, '.pi'),
  Fs.join(WORKSPACE_ROOT, '.pi'),
  Fs.join(
    PACKAGE_ROOT,
    'src/m.core/m.cli.profiles/u/u.start.gui.service.evidence.ts',
  ),
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
    expect(
      await permissionState({ name: 'net', host: '127.0.0.1:8080' }),
    ).to.eql('denied');
  });

  it('preserves primary failure when cleanup also rejects', async () => {
    const primary = new Error('primary');
    const cleanup = new Error('cleanup');
    let thrown: unknown;
    try {
      await runWithCleanup(
        () => Promise.reject(primary),
        () => Promise.reject(cleanup),
      );
    } catch (cause) {
      thrown = cause;
    }
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
        expect(unavailable.error).to.be.instanceOf(Error);
      },
      async () => {
        if (source) await source.close();
      },
      () => cleanupRoot(root),
    );
  });

  it('refuses wrong manifest authority and package identity before GUI execution', async () => {
    let source: Awaited<ReturnType<typeof startLocalServe>> | undefined;
    let pinRoot: t.StringAbsoluteDir | undefined;
    let pkgRoot: t.StringAbsoluteDir | undefined;
    await runWithCleanup(
      async () => {
        source = await startLocalServe(DIST_DIR);
        const evidence = evidenceAt(source.origin);
        pinRoot = await temporaryRoot('driver-pi.release-local.pin.');
        pkgRoot = await temporaryRoot('driver-pi.release-local.pkg.');
        const wrongPin = `${evidence.integrity.slice(0, -1)}${
          evidence.integrity.endsWith('0') ? '1' : '0'
        }` as t.StringHash;
        const refusedPin = await runSession(pinRoot, {
          ...evidence,
          integrity: wrongPin,
        });
        expect(refusedPin.state.kind).to.eql('failed');
        if (refusedPin.state.kind !== 'failed') throw new Error('Expected failed pin state.');
        expect(refusedPin.state.category).to.eql('artifact-refused');
        expect(refusedPin.state.safeEvidence).to.include({
          kind: 'materialization',
          reason: 'integrity-mismatch',
        });
        expect(refusedPin.appStarts).to.eql(0);
        expect(refusedPin.bootstrapStatus).to.eql(200);
        expect(refusedPin.location).to.eql(undefined);
        expect(await generationExists(pinRoot, wrongPin)).to.eql(false);
        expect(await generationExists(pinRoot, evidence.integrity)).to.eql(false);

        const refusedPkg = await runSession(pkgRoot, {
          ...evidence,
          expectedPkg: Object.freeze({
            ...evidence.expectedPkg,
            version: `${evidence.expectedPkg.version}-skew`,
          }),
        });
        expect(refusedPkg.state.kind).to.eql('failed');
        if (refusedPkg.state.kind !== 'failed') throw new Error('Expected failed package state.');
        expect(refusedPkg.state.category).to.eql('artifact-refused');
        expect(refusedPkg.state.safeEvidence.kind).to.eql('identity');
        expect(refusedPkg.appStarts).to.eql(0);
        expect(refusedPkg.bootstrapStatus).to.eql(200);
        expect(refusedPkg.location).to.eql(undefined);
      },
      async () => {
        if (source) await source.close();
      },
      async () => {
        if (pinRoot) await cleanupRoot(pinRoot);
      },
      async () => {
        if (pkgRoot) await cleanupRoot(pkgRoot);
      },
    );
  });

  it('refuses changed transported manifest bytes without promotion or GUI execution', async () => {
    const root = await temporaryRoot('driver-pi.release-local.manifest-tamper.');
    let transport: Awaited<ReturnType<typeof startTamperedTransport>> | undefined;
    await runWithCleanup(
      async () => {
        transport = await startTamperedTransport('manifest');
        const session = await runSession(root, transport.source);
        expect(session.state.kind).to.eql('failed');
        if (session.state.kind !== 'failed') throw new Error('Expected manifest refusal.');
        expect(session.state.category).to.eql('artifact-refused');
        expect(session.appStarts).to.eql(0);
        expect(session.bootstrapStatus).to.eql(200);
        expect(session.location).to.eql(undefined);
        expect(await generationExists(root, transport.source.integrity)).to.eql(false);
      },
      async () => {
        if (transport) await transport.close();
      },
      () => cleanupRoot(root),
    );
  });

  it('refuses changed transported asset bytes without promotion or GUI execution', async () => {
    const root = await temporaryRoot('driver-pi.release-local.asset-tamper.');
    let transport: Awaited<ReturnType<typeof startTamperedTransport>> | undefined;
    await runWithCleanup(
      async () => {
        transport = await startTamperedTransport('asset');
        const session = await runSession(root, transport.source);
        expect(session.state.kind).to.eql('failed');
        if (session.state.kind !== 'failed') throw new Error('Expected asset refusal.');
        expect(session.state.category).to.eql('artifact-refused');
        expect(session.appStarts).to.eql(0);
        expect(session.bootstrapStatus).to.eql(200);
        expect(session.location).to.eql(undefined);
        expect(await generationExists(root, transport.source.integrity)).to.eql(false);
      },
      async () => {
        if (transport) await transport.close();
      },
      () => cleanupRoot(root),
    );
  });
});

async function permissionState(
  descriptor: Deno.PermissionDescriptor,
): Promise<PermissionState> {
  return (await Deno.permissions.query(descriptor)).state;
}
