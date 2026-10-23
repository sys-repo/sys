import { describe, expect, it, type t } from '../../../-test.ts';
import { cleanupAll } from '../../../../-scripts/-test.external/u.fixture.start.gui.release.local.ts';
import { Dist, DistServer, Fs, FsDist, Json } from '../u.start/common.ts';
import {
  admitApplicationPkg,
  admitGenerationPkg,
  applicationStartArgs,
  generationOpenArgs,
  snapshotReleaseAuthority,
  START_GUI_SERVICE,
} from '../u.start/u.gui/u.service.ts';
import { GUI_PACKAGE_POLICY, readGuiPackage } from '../u.start/u.gui/u.pkg.ts';
import type { Start } from '../u.start/u.gui/t.ts';
import {
  fakeGeneration,
  rejectionOf,
  RELEASE_EVIDENCE,
  removeDistFixtureRoot,
  removeDistStore,
  TEST_PACKAGE,
} from './u.fixture.start.gui.ts';

type Candidate = Awaited<ReturnType<typeof candidate>>;

const ORIGIN = 'http://127.0.0.1:1234';
const OTHER = Object.freeze({ name: '@other/gui', version: '9.9.9' });

describe('@sys/driver-pi covered package policy', () => {
  it('fresh independent pin → cold materialization and offline reuse retain both package checks', async () => {
    const temporary = await Fs.makeTempDir({ prefix: 'driver-pi.package-store.' });
    const root = await Fs.realPath(temporary.absolute);
    try {
      const fixture = await candidate(Json.stringify(TEST_PACKAGE));
      try {
        await Fs.write(fixture.manifest, Json.stringify({ ...fixture.dist, pkg: OTHER }));
        await proveColdAndOfflineReuse(root, fixture);
      } finally {
        await fixture.dispose();
      }
    } finally {
      await removeDistFixtureRoot(
        root,
        () => removeDistStore(Fs.join(root, START_GUI_SERVICE.store.root)),
      );
    }
  });

  it('owned-store removal or release refusal → no ancestor deletion, original cause retained', async () => {
    for (const phase of ['removal', 'release']) {
      const cause = new Error(`store ${phase} refused`);
      const events: string[] = [];
      const error = await rejectionOf(() =>
        removeDistFixtureRoot('/fixture', () => {
          events.push('store');
          return Promise.reject(cause);
        }, () => {
          events.push('root');
          return Promise.resolve();
        })
      );
      expect(error).to.equal(cause);
      expect(events).to.eql(['store']);
    }
  });

  it('fixture root removal awaits successful owned-store settlement', async () => {
    const events: string[] = [];
    await removeDistFixtureRoot('/fixture', async () => {
      events.push('store');
      await Promise.resolve();
      events.push('settled');
    }, (root) => {
      expect(root).to.eql('/fixture');
      events.push('root');
      return Promise.resolve();
    });
    expect(events).to.eql(['store', 'settled', 'root']);
  });

  it('independent cleanup still aggregates failures without bypassing store refusal', async () => {
    const store = new Error('store refused');
    const other = new Error('independent cleanup failed');
    const events: string[] = [];
    const error = await rejectionOf(() =>
      cleanupAll(
        () =>
          removeDistFixtureRoot('/fixture', () => Promise.reject(store), () => {
            events.push('root');
            return Promise.resolve();
          }),
        () => {
          events.push('independent');
          return Promise.reject(other);
        },
      )
    );
    expect(error).to.be.instanceOf(AggregateError);
    expect((error as AggregateError).errors).to.eql([store, other]);
    expect(events).to.eql(['independent']);
  });

  it('root labels changed or absent → both package checks retain payload authority', async () => {
    const fixture = await candidate(Json.stringify(TEST_PACKAGE));
    try {
      const authority = releaseAuthority(fixture.pin);
      for (const pkg of [TEST_PACKAGE, OTHER, undefined]) {
        await Fs.write(fixture.manifest, Json.stringify({ ...fixture.dist, pkg }));
        const verification = await fixture.verify();
        expect(verification.content.digest).to.eql(fixture.pin.digest);
        const until = new AbortController().signal;
        const generation = {
          ...fakeGeneration(),
          dir: fixture.dir,
          pin: fixture.pin,
          verification,
        };
        const application = { origin: ORIGIN, verification };
        const admittedDir = await admitGenerationPkg(authority, generation, until);
        expect(admittedDir).to.eql(fixture.dir);
        const identity = await admitApplicationPkg(authority, fixture.dir, application, until);
        expect(identity).to.eql({ origin: ORIGIN, digest: fixture.pin.digest });
      }
    } finally {
      await fixture.dispose();
    }
  });

  it('valid but different covered package → refusal despite a matching root label', async () => {
    const fixture = await candidate(Json.stringify(OTHER));
    try {
      const verification = await fixture.verify();
      const authority = releaseAuthority(fixture.pin);
      const until = new AbortController().signal;
      expect(fixture.dist.pkg).to.eql(TEST_PACKAGE);
      const generation = { ...fakeGeneration(), dir: fixture.dir, pin: fixture.pin, verification };
      const application = { origin: ORIGIN, verification };
      const admittedDir = await admitGenerationPkg(authority, generation, until);
      expect(admittedDir).to.eql(undefined);
      const identity = await admitApplicationPkg(authority, fixture.dir, application, until);
      expect(identity).to.eql(undefined);
      // The expectation is independently chosen, never recovered from root metadata.
      const matching = { ...authority, expectedPkg: OTHER };
      const matchingIdentity = await admitApplicationPkg(matching, fixture.dir, application, until);
      expect(matchingIdentity).to.eql({ origin: ORIGIN, digest: fixture.pin.digest });
    } finally {
      await fixture.dispose();
    }
  });

  it('missing or malformed covered declaration → no unknown defaults or metadata fallback', async () => {
    const invalid = [
      undefined,
      '',
      '{',
      'null',
      '[]',
      '{}',
      Json.stringify({ name: TEST_PACKAGE.name }),
      Json.stringify({ name: TEST_PACKAGE.name, version: 1 }),
      Json.stringify({ name: '', version: TEST_PACKAGE.version }),
      Json.stringify({ ...TEST_PACKAGE, version: '1.0.0\n' }),
      Json.stringify({ ...TEST_PACKAGE, version: '\ud800' }),
      new Uint8Array([0xff]),
    ];
    for (const declaration of invalid) {
      const fixture = await candidate(declaration);
      try {
        const { content } = await fixture.verify();
        expect(await readGuiPackage(fixture.dir, content)).to.eql(undefined);
      } finally {
        await fixture.dispose();
      }
    }
  });

  it('unlisted, inherited, oversized or pre-cancelled declaration → no part read', async () => {
    const fixture = await candidate(Json.stringify(TEST_PACKAGE));
    try {
      const { content } = await fixture.verify();
      const path = GUI_PACKAGE_POLICY.path;
      const part = FsDist.Part.parse(content.parts[path]);
      if (!part) throw new Error('Expected declared package part.');
      const noRead = () => {
        throw new Error('Package policy must refuse before allocating or opening a part.');
      };
      const invalid = [
        { ...content, parts: {} },
        { ...content, parts: Object.create(content.parts) },
        {
          ...content,
          parts: { [path]: `${part.hash}:size=${GUI_PACKAGE_POLICY.maxBytes + 1}` },
        },
      ];
      for (const value of invalid) {
        expect(await readGuiPackage(fixture.dir, value, undefined, noRead)).to.eql(undefined);
      }
      const abort = new AbortController();
      abort.abort();
      expect(await readGuiPackage(fixture.dir, content, abort.signal, noRead)).to.eql(undefined);
    } finally {
      await fixture.dispose();
    }
  });

  it('changed, missing or symlinked bytes after verification → package refusal', async () => {
    const fixture = await candidate(Json.stringify(TEST_PACKAGE));
    try {
      const { content } = await fixture.verify();
      await Fs.write(fixture.declaration, Json.stringify(OTHER));
      expect(await readGuiPackage(fixture.dir, content)).to.eql(undefined);
      await Fs.remove(fixture.declaration);
      expect(await readGuiPackage(fixture.dir, content)).to.eql(undefined);
      await Fs.ensureSymlink(Fs.join(fixture.dir, 'index.html'), fixture.declaration);
      expect(await readGuiPackage(fixture.dir, content)).to.eql(undefined);
    } finally {
      await fixture.dispose();
    }
  });

  it('covered declaration changes → changed content pin and old-pin refusal', async () => {
    const first = await candidate(Json.stringify(TEST_PACKAGE));
    try {
      const second = await candidate(Json.stringify(OTHER));
      try {
        expect(first.pin).not.to.eql(second.pin);
        const refused = await FsDist.Pinned.verify({
          dir: second.dir,
          pin: first.pin,
          limits: START_GUI_SERVICE.limits,
        });
        expect(refused.kind).to.eql('pin-mismatch');
      } finally {
        await second.dispose();
      }
    } finally {
      await first.dispose();
    }
  });
});

/** Own the source listener across cold acquisition and deliberately offline reuse. */
async function proveColdAndOfflineReuse(root: t.StringDir, fixture: Candidate) {
  const source = await DistServer.Local.start({
    dir: fixture.dir,
    limits: START_GUI_SERVICE.limits,
    hostname: '127.0.0.1',
    port: 0,
    silent: true,
    keyboard: false,
  });
  try {
    const snapshot = snapshotReleaseAuthority({
      ...RELEASE_EVIDENCE,
      manifestUrl: new URL('/dist.json', source.origin).href,
      pin: fixture.pin,
    });
    if (!snapshot.ok) throw snapshot.failure.error;
    const authority = snapshot.authority;
    if (authority.kind !== 'release') throw new Error('Expected release authority.');
    const until = new AbortController().signal;
    let retainedDocument: t.StringHash | undefined;
    for (const kind of ['promoted', 'existing'] as const) {
      const opened = await Dist.Generation.open(generationOpenArgs(root, authority, until));
      expect(opened.kind).to.eql('opened');
      if (opened.kind !== 'opened') throw new Error('Expected opened generation.');
      try {
        const generation = opened.generation;
        expect(generation.kind).to.eql(kind);
        expect(generation.pin).to.eql(fixture.pin);
        const admittedDir = await admitGenerationPkg(authority, generation, until);
        expect(admittedDir).to.eql(generation.dir);
        const checksum = generation.verification.manifestChecksum;
        if (retainedDocument) expect(checksum).to.eql(retainedDocument);
        retainedDocument = checksum;
        await proveHostedPackage(authority, generation.dir, until, fixture.pin);
      } finally {
        await opened.owner.release();
      }
      await source.close(); // The second open must succeed without its source listener.
    }
  } finally {
    await source.close();
  }
}

/** Close the application before returning control to its generation owner. */
async function proveHostedPackage(
  authority: Start.Gui.Release.Authority,
  dir: t.StringAbsoluteDir,
  until: AbortSignal,
  pin: t.DistPin,
) {
  const application = await DistServer.start(applicationStartArgs(authority, dir, until));
  try {
    const identity = await admitApplicationPkg(authority, dir, application, until);
    expect(identity).to.eql({ origin: application.origin, digest: pin.digest });
    const response = await fetch(application.origin);
    expect(response.status).to.eql(200);
    expect(await response.text()).to.eql('<h1>Pi package policy</h1>');
    const manifest = await fetch(new URL('/dist.json', application.origin));
    expect(manifest.status).to.eql(404);
    await manifest.arrayBuffer();
  } finally {
    await application.close();
  }
}

/** Real fresh producer output; no checked-in evidence is read or rebound. */
async function candidate(declaration: string | Uint8Array | undefined) {
  const temporary = await Fs.makeTempDir({ prefix: 'driver-pi.package-policy.' });
  const dir = await Fs.realPath(temporary.absolute);
  const declarationPath = Fs.join(dir, GUI_PACKAGE_POLICY.path);
  try {
    await Fs.write(Fs.join(dir, 'index.html'), '<h1>Pi package policy</h1>');
    await Fs.write(Fs.join(dir, 'sw.js'), 'self.registration.unregister();');
    if (declaration !== undefined) await Fs.write(declarationPath, declaration);
    const computed = await FsDist.compute({ dir, pkg: TEST_PACKAGE, save: true });
    if (computed.kind !== 'computed') throw new Error('Expected computed test candidate.');
    return {
      dir,
      declaration: declarationPath,
      manifest: Fs.join(dir, 'dist.json'),
      dist: computed.dist,
      pin: computed.pin,
      async verify() {
        const result = await FsDist.Pinned.verify({
          dir,
          pin: computed.pin,
          limits: START_GUI_SERVICE.limits,
        });
        if (result.kind !== 'verified') throw new Error(`Candidate refused: ${result.kind}`);
        return result.evidence;
      },
      dispose: () => Fs.remove(dir),
    };
  } catch (cause) {
    await Fs.remove(dir);
    throw cause;
  }
}

function releaseAuthority(pin: t.DistPin) {
  const result = snapshotReleaseAuthority({ ...RELEASE_EVIDENCE, pin });
  if (!result.ok) throw result.failure.error;
  if (result.authority.kind !== 'release') throw new Error('Expected release authority.');
  return result.authority;
}
