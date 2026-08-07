import { Hash } from '@sys/crypto/hash';
import { describe, expect, Fs, it, type t } from '../../-test.ts';
import { DistServer } from '../mod.ts';
import {
  DEFAULT_DEPENDENCIES,
  type StartDependencies,
  startLocalWith,
} from '../u.server/u.start.ts';
import { setup, teardown } from './u.fixture.ts';

const HASH = `sha256-${'0'.repeat(64)}` as t.StringHash;

function validLocalInput(): t.DistServer.Local.Args {
  return {
    dir: '/tmp/dist-generation' as t.StringDir,
    limits: {
      manifestBytes: 1024,
      entries: 10,
      fileBytes: 1024,
      totalBytes: 4096,
    },
    silent: true,
  };
}

describe('DistServer local authority', () => {
  it('derives explicit local-unpinned authority from exact manifest bytes', async () => {
    const fixture = await setup();
    let server: t.DistServer.Started | undefined;
    try {
      const manifest = fixture.manifestBytes;
      const exactManifest = new Uint8Array(manifest.byteLength + 1);
      exactManifest.set(manifest);
      exactManifest[exactManifest.byteLength - 1] = 0x0a;
      await Fs.write(Fs.join(fixture.source, 'dist.json'), exactManifest);
      const integrity = Hash.sha256(exactManifest);

      server = await DistServer.Local.start({
        dir: fixture.source as t.StringDir,
        limits: fixture.policy.verification,
        silent: true,
      });

      expect(server.authority).to.eql({ kind: 'local-unpinned', integrity });
      expect(server.verification.integrity).to.eql(integrity);
      expect(server.verification.manifestBytes).to.eql(exactManifest.byteLength);
      expect(Object.isFrozen(server.authority)).to.eql(true);
      expect(Object.isFrozen(server.verification)).to.eql(true);
      expect(Object.isFrozen(server.verification.dist)).to.eql(true);
      expect(Object.isFrozen(server.verification.dist.hash.parts)).to.eql(true);

      const authority = Object.getOwnPropertyDescriptor(server, 'authority');
      const verification = Object.getOwnPropertyDescriptor(server, 'verification');
      expect({
        enumerable: authority?.enumerable,
        writable: authority?.writable,
        configurable: authority?.configurable,
      }).to.eql({ enumerable: true, writable: false, configurable: false });
      expect({
        enumerable: verification?.enumerable,
        writable: verification?.writable,
        configurable: verification?.configurable,
      }).to.eql({ enumerable: true, writable: false, configurable: false });

      const initial = await fetch(server.origin);
      expect(initial.status).to.eql(200);
      expect(await initial.text()).to.eql('<h1>verified</h1>');

      await Fs.write(Fs.join(fixture.source, 'index.html'), '<h1>tampered</h1>');
      const changed = await fetch(server.origin);
      expect(changed.status).to.eql(412);
      expect((await changed.arrayBuffer()).byteLength).to.eql(0);
    } finally {
      await server?.close('test.cleanup');
      await teardown(fixture);
    }
  });

  it('refuses an undeclared local entry as a sanitized verification failure', async () => {
    const fixture = await setup();
    try {
      await Fs.write(Fs.join(fixture.source, 'undeclared.txt'), 'not declared');
      const error = await catchStart(() => {
        return DistServer.Local.start({
          dir: fixture.source as t.StringDir,
          limits: fixture.policy.verification,
          silent: true,
        });
      });

      expect(DistServer.Error.is(error)).to.eql(true);
      expect(error?.reason).to.eql('unexpected-entry');
      expect(error?.message).to.eql('DistServer.start: pinned generation verification failed.');
      expect(JSON.stringify(error)).to.not.include(fixture.source);
      expect(error).to.not.have.property('cause');
    } finally {
      await teardown(fixture);
    }
  });

  it('rejects cross-mode and malformed local input before verification or listener startup', async () => {
    let pinnedVerifies = 0;
    let localVerifies = 0;
    let starts = 0;
    const deps: StartDependencies = {
      ...DEFAULT_DEPENDENCIES,
      verify() {
        pinnedVerifies += 1;
        return Promise.resolve({ kind: 'missing' });
      },
      verifyLocal() {
        localVerifies += 1;
        return Promise.resolve({ kind: 'unexpected-entry' });
      },
      startHttp() {
        starts += 1;
        throw new Error('Listener must not start.');
      },
    };

    let getterReads = 0;
    const accessor = validLocalInput();
    Object.defineProperty(accessor, 'dir', {
      enumerable: true,
      get() {
        getterReads += 1;
        return '/tmp/ambient';
      },
    });

    const inherited = Object.create({ dir: '/tmp/ambient' });
    Object.assign(inherited, validLocalInput());
    delete inherited.dir;

    const cases: readonly [unknown, t.DistServer.StartFailureReason][] = [
      [{ ...validLocalInput(), integrity: HASH }, 'invalid-input'],
      [{ ...validLocalInput(), unexpected: true }, 'invalid-input'],
      [
        { ...validLocalInput(), limits: { ...validLocalInput().limits, unexpected: true } },
        'invalid-input',
      ],
      [accessor, 'invalid-input'],
      [inherited, 'invalid-input'],
      [{ ...validLocalInput(), hostname: '0.0.0.0' }, 'invalid-hostname'],
    ];

    for (const [input, reason] of cases) {
      const error = await catchStart(() => startLocalWith(input, deps));
      expect(error?.reason).to.eql(reason);
    }
    expect({ pinnedVerifies, localVerifies, starts, getterReads }).to.eql({
      pinnedVerifies: 0,
      localVerifies: 0,
      starts: 0,
      getterReads: 0,
    });

    const refused = await catchStart(() => startLocalWith(validLocalInput(), deps));
    expect(refused?.reason).to.eql('unexpected-entry');
    expect({ pinnedVerifies, localVerifies, starts }).to.eql({
      pinnedVerifies: 0,
      localVerifies: 1,
      starts: 0,
    });
  });

  it('snapshots local authority before the scheduler boundary', async () => {
    let observed: t.FsPkg.Dist.Local.Verify.Args | undefined;
    const deps: StartDependencies = {
      ...DEFAULT_DEPENDENCIES,
      verifyLocal(args) {
        observed = args;
        return Promise.resolve({ kind: 'missing' });
      },
    };
    const input = validLocalInput();
    const expected = structuredClone(input);
    const pending = startLocalWith(input, deps);

    input.dir = '/tmp/mutated' as t.StringDir;
    input.limits.entries = 1;
    input.limits.totalBytes = 0;

    const error = await catchStart(() => pending);
    expect(error?.reason).to.eql('missing');
    expect(observed).to.eql({
      dir: expected.dir,
      limits: expected.limits,
      until: observed?.until,
    });
    expect(Object.isFrozen(observed?.limits)).to.eql(true);
  });
});

async function catchStart(
  fn: () => Promise<unknown>,
): Promise<t.DistServer.StartError | undefined> {
  try {
    await fn();
  } catch (cause) {
    return cause as t.DistServer.StartError;
  }
}
