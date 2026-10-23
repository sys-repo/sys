import { describe, expect, it, type t } from '../../../-test.ts';
import { Obj } from '../common.ts';
import {
  admitApplicationPkg,
  admitGenerationPkg,
  applicationStartArgs,
  generationOpenArgs,
  generationOpenFailure,
  packageRefusal,
  snapshotDevelopmentAuthority,
  snapshotReleaseAuthority,
  START_GUI_SERVICE,
} from '../u.start/u.gui/u.service.ts';
import type { Start } from '../u.start/u.gui/t.ts';
import {
  fakeGeneration,
  fixtureReadPart,
  GENERATION_DIR,
  LEGACY_RELEASE_EVIDENCE,
  RELEASE_EVIDENCE,
  startedFixture,
} from './u.fixture.start.gui.ts';

const ROOT: t.StringDir = '/tmp/driver-pi-gui-policy';

describe('@sys/driver-pi start:gui policy', () => {
  it('refuses explicit legacy evidence rather than relabeling or repinning it', () => {
    const snapshot = snapshotReleaseAuthority(LEGACY_RELEASE_EVIDENCE);
    expect(snapshot.ok).to.eql(false);
    if (snapshot.ok) throw new Error('Expected old rehearsal authority to refuse.');
    expect(snapshot.failure.evidence).to.eql({ kind: 'configuration', reason: 'pin' });
  });

  it('snapshots one closed canonical release authority', () => {
    const snapshot = snapshotReleaseAuthority(RELEASE_EVIDENCE);
    expect(snapshot.ok).to.eql(true);
    if (!snapshot.ok) return;

    expect(snapshot.authority).to.eql({
      kind: 'release',
      source: {
        href: RELEASE_EVIDENCE.manifestUrl,
        origin: new URL(RELEASE_EVIDENCE.manifestUrl).origin,
      },
      pin: RELEASE_EVIDENCE.pin,
      expectedPkg: RELEASE_EVIDENCE.expectedPkg,
    });
    expect(Object.isFrozen(snapshot.authority)).to.eql(true);
    expect(Object.isFrozen(snapshot.authority.expectedPkg)).to.eql(true);
  });

  it('admits only complete frozen preview authority', () => {
    const expectedPkg = {
      name: RELEASE_EVIDENCE.expectedPkg.name,
      version: RELEASE_EVIDENCE.expectedPkg.version,
    };
    const input: Start.Gui.Development.Evidence = {
      kind: 'development',
      dir: GENERATION_DIR,
      pin: { ...RELEASE_EVIDENCE.pin },
      expectedPkg,
    };
    const snapshot = snapshotDevelopmentAuthority(input);
    expect(snapshot.ok).to.eql(true);
    if (!snapshot.ok) return;

    expect(snapshot.authority).to.eql(input);
    expect(snapshot.authority).not.to.equal(input);
    expect(snapshot.authority.expectedPkg).not.to.equal(expectedPkg);
    expect(snapshot.authority.pin).not.to.equal(input.pin);
    expect(Object.isFrozen(snapshot.authority.pin)).to.eql(true);
    expect(Object.isFrozen(snapshot.authority)).to.eql(true);
    expect(Object.isFrozen(snapshot.authority.expectedPkg)).to.eql(true);

    const invalid = [
      { ...input, dir: 'relative' },
      { ...input, pin: 'sha256-nope' },
      { ...input, integrity: RELEASE_EVIDENCE.pin.digest },
      { ...input, pin: { ...input.pin, scheme: 'legacy' } },
      { ...input, pin: { ...input.pin, digest: `${input.pin.digest}:size=1` } },
      { ...input, kind: 'release' },
      { ...input, expectedPkg: { name: '', version: '1.0.0' } },
    ];
    for (const value of invalid) {
      const refused = snapshotDevelopmentAuthority(value);
      expect(refused.ok).to.eql(false);
      if (refused.ok) throw new Error('Expected invalid preview authority to be refused.');
      expect(refused.failure.category).to.eql('configuration-invalid');
    }
  });

  it('projects exact release and development package authority', () => {
    const snapshot = snapshotReleaseAuthority(RELEASE_EVIDENCE);
    if (!snapshot.ok) throw snapshot.failure.error;
    if (snapshot.authority.kind !== 'release') throw new Error('Expected release authority.');
    const until = new AbortController().signal;
    const generation = generationOpenArgs(ROOT, snapshot.authority, until);
    const pinned = applicationStartArgs(snapshot.authority, GENERATION_DIR, until);
    const developmentSnapshot = snapshotDevelopmentAuthority({
      kind: 'development',
      dir: GENERATION_DIR,
      pin: RELEASE_EVIDENCE.pin,
      expectedPkg: RELEASE_EVIDENCE.expectedPkg,
    });
    if (!developmentSnapshot.ok) throw developmentSnapshot.failure.error;
    const development = applicationStartArgs(
      developmentSnapshot.authority,
      GENERATION_DIR,
      until,
    );

    expect(generation.store).to.eql({
      root: `${ROOT}/${START_GUI_SERVICE.store.root}`,
      target: START_GUI_SERVICE.store.target,
    });
    expect(generation.manifestUrl).to.eql(RELEASE_EVIDENCE.manifestUrl);
    expect(generation.pin).to.eql(RELEASE_EVIDENCE.pin);
    expect(generation.policy.verification).to.equal(START_GUI_SERVICE.limits);
    expect(pinned.browserPolicy).to.equal(START_GUI_SERVICE.browserPolicy);
    expect(pinned.hostname).to.eql('127.0.0.1');
    expect(development.browserPolicy).to.equal(START_GUI_SERVICE.browserPolicy);
    expect(Obj.hasOwn(development, 'integrity')).to.eql(false);
    expect(development.pin).to.eql(RELEASE_EVIDENCE.pin);
  });

  it('keeps Generation and hosted package admission independent', async () => {
    const snapshot = snapshotReleaseAuthority(RELEASE_EVIDENCE);
    if (!snapshot.ok) throw snapshot.failure.error;
    if (snapshot.authority.kind !== 'release') throw new Error('Expected release authority.');
    const generation = fakeGeneration();
    const application = startedFixture();

    const until = new AbortController().signal;
    const admittedDir = await admitGenerationPkg(
      snapshot.authority,
      generation,
      until,
      fixtureReadPart,
    );
    expect(admittedDir).to.eql(generation.dir);
    const identity = await admitApplicationPkg(
      snapshot.authority,
      generation.dir,
      application,
      until,
      fixtureReadPart,
    );
    expect(identity).to.eql({
      origin: application.origin,
      digest: application.verification.content.digest,
    });

    const wrongPkg = Object.freeze({ name: '@other/gui', version: '1.0.0' });
    const refusedGeneration = await admitGenerationPkg(
      snapshot.authority,
      fakeGeneration(wrongPkg),
      until,
      fixtureReadPart,
    );
    expect(refusedGeneration).to.eql(undefined);
    const refusedApplication = await admitApplicationPkg(
      snapshot.authority,
      generation.dir,
      startedFixture({ pkg: wrongPkg }),
      until,
      fixtureReadPart,
    );
    expect(refusedApplication).to.eql(undefined);
    expect(packageRefusal()).to.include({ category: 'artifact-refused' });
  });

  it('maps Generation failures to the six bounded product categories', () => {
    const failure = (
      generation: t.Dist.Failed,
    ): t.Dist.Generation.Failure.Materialization =>
      Object.freeze({
        kind: 'failed',
        phase: 'materialization',
        generation: Object.freeze(generation),
        ownership: 'released',
      });
    const cancelled = Object.freeze({
      kind: 'failed',
      phase: 'input',
      reason: 'cancelled',
      ownership: 'not-acquired',
    });
    const cases = [
      [
        failure({
          kind: 'failed',
          stage: 'manifest-fetch',
          reason: 'resource-failure',
          cleanup: 'not-needed',
        }),
        'source-unavailable',
      ],
      [
        failure({
          kind: 'failed',
          stage: 'manifest-admission',
          reason: 'malformed-manifest',
          cleanup: 'not-needed',
        }),
        'artifact-refused',
      ],
      [
        failure({
          kind: 'failed',
          stage: 'existing-verification',
          reason: 'verification-failure',
          cleanup: 'not-needed',
          publication: 'occupied',
        }),
        'repair-required',
      ],
      [
        failure({
          kind: 'failed',
          stage: 'input',
          reason: 'invalid-policy',
          cleanup: 'not-needed',
        }),
        'configuration-invalid',
      ],
      [
        failure({
          kind: 'failed',
          stage: 'storage',
          reason: 'filesystem-failure',
          cleanup: 'not-needed',
        }),
        'local-failure',
      ],
      [cancelled, 'cancelled'],
    ] as const;

    for (const [input, category] of cases) {
      expect(generationOpenFailure(input).category).to.eql(category);
    }
  });
});
