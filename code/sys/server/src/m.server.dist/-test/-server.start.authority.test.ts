import { describe, expect, Files, it, Json, type t, Time } from '../../-test.ts';
import { setup, teardown } from '../../-test/u.fixture.dist.ts';
import { Dist, DistServer } from '../mod.ts';
import { acceptedAuthorities } from '../u.server/u.host.ts';
import { DEFAULT_DEPENDENCIES, type StartDependencies, startWith } from '../u.server.start/mod.ts';

const HASH = `sha256-${'0'.repeat(64)}` as t.StringHash;

describe('DistServer.start', () => {
  describe('authority', () => {
    it('rejects unknown, inherited, accessor, and nested-extra input before verification', async () => {
      let verifies = 0;
      const deps: StartDependencies = {
        ...DEFAULT_DEPENDENCIES,
        verify() {
          verifies++;
          return Promise.resolve({ kind: 'missing' });
        },
      };

      let getterReads = 0;
      const accessor = validInput() as t.DistServer.Start.Args & { name?: string };
      Object.defineProperty(accessor, 'name', {
        enumerable: true,
        get() {
          getterReads++;
          return 'ambient';
        },
      });

      const inherited = Object.create({ dir: '/tmp/ambient' });
      Object.assign(inherited, validInput());
      delete inherited.dir;

      const cases: unknown[] = [
        { ...validInput(), pkgSubpath: 'ui' },
        { ...validInput(), unexpected: true },
        { ...validInput(), limits: { ...validInput().limits, unexpected: true } },
        { ...validInput(), keyboard: 'nope' },
        { ...validInput(), keyboard: { print: 'nope' } },
        accessor,
        inherited,
      ];

      for (const input of cases) {
        const error = await catchStart(() => startWith(input, deps));
        expect(error?.reason).to.eql('invalid-input');
      }
      expect(verifies).to.eql(0);
      expect(getterReads).to.eql(0);
    });

    it('admits and forwards explicit disabled keyboard authority', async () => {
      const fixture = await setup();
      let server: t.HttpServer.Started | undefined;
      try {
        const materialized = await Dist.materialize(fixture.args());
        expect(materialized.kind).to.eql('promoted');
        if (materialized.kind !== 'promoted') return;

        const observed: unknown[] = [];
        const deps: StartDependencies = {
          ...DEFAULT_DEPENDENCIES,
          verify: () => Promise.resolve({ kind: 'verified', evidence: materialized.verification }),
          startHttp(app, options) {
            observed.push(options?.keyboard);
            return DEFAULT_DEPENDENCIES.startHttp(app, options);
          },
        };
        server = await startWith({
          ...validInput(),
          dir: materialized.dir,
          integrity: materialized.integrity,
          limits: fixture.policy.verification,
          keyboard: false,
        }, deps);

        expect(observed).to.eql([false]);
      } finally {
        await server?.close('test.cleanup');
        await teardown(fixture);
      }
    });

    it('rejects every non-loopback or bracketed bind before verification', async () => {
      let verifies = 0;
      const deps: StartDependencies = {
        ...DEFAULT_DEPENDENCIES,
        verify() {
          verifies++;
          return Promise.resolve({ kind: 'missing' });
        },
      };

      for (const hostname of ['0.0.0.0', '::', '[::1]', '127.0.0.2', 'example.test']) {
        const error = await catchStart(() => {
          return startWith({ ...validInput(), hostname: hostname as t.StringHostname }, deps);
        });
        expect([hostname, error?.reason]).to.eql([hostname, 'invalid-hostname']);
      }
      expect(verifies).to.eql(0);
    });

    it('snapshots complete nested authority before the scheduler boundary', async () => {
      let observed: t.FsPkg.Dist.Pinned.Verify.Args | undefined;
      const deps: StartDependencies = {
        ...DEFAULT_DEPENDENCIES,
        verify(args) {
          observed = args;
          return Promise.resolve({ kind: 'missing' });
        },
      };
      const input = validInput();
      const expected = structuredClone(input);
      const pending = startWith(input, deps);

      input.dir = '/tmp/mutated' as t.StringDir;
      input.integrity = `sha256-${'1'.repeat(64)}` as t.StringHash;
      input.limits.entries = 1;
      input.limits.totalBytes = 0;

      const error = await catchStart(() => pending);
      expect(error?.reason).to.eql('missing');
      expect(observed).to.eql({
        dir: expected.dir,
        integrity: expected.integrity,
        limits: expected.limits,
        until: observed?.until,
      });
      expect(Object.isFrozen(observed?.limits)).to.eql(true);
    });

    it('latches pre-cancellation before verification and sanitizes its reason', async () => {
      const controller = new AbortController();
      controller.abort({ private: 'operator reason' });
      let verifies = 0;
      const deps: StartDependencies = {
        ...DEFAULT_DEPENDENCIES,
        verify() {
          verifies++;
          return Promise.resolve({ kind: 'missing' });
        },
      };

      const error = await catchStart(() =>
        startWith({ ...validInput(), until: controller.signal }, deps)
      );
      expect(error?.reason).to.eql('cancelled');
      expect(error?.message).to.eql('DistServer.start: startup cancelled.');
      expect(Json.stringify(error)).to.not.include('operator reason');
      expect(verifies).to.eql(0);
    });

    it('maps adapter construction failure without opening a listener or leaking its message', async () => {
      const fixture = await setup();
      try {
        const materialized = await Dist.materialize(fixture.args());
        expect(materialized.kind).to.eql('promoted');
        if (materialized.kind !== 'promoted') return;

        let starts = 0;
        const deps: StartDependencies = {
          ...DEFAULT_DEPENDENCIES,
          verify: () => Promise.resolve({ kind: 'verified', evidence: materialized.verification }),
          fromDist() {
            throw new Error(`private adapter path: ${materialized.dir}`);
          },
          startHttp(...args) {
            starts++;
            return DEFAULT_DEPENDENCIES.startHttp(...args);
          },
        };
        const error = await catchStart(() => {
          return startWith({
            dir: materialized.dir,
            integrity: materialized.integrity,
            limits: fixture.policy.verification,
            silent: true,
          }, deps);
        });

        expect(error?.reason).to.eql('startup-failure');
        expect(error?.message).to.eql('DistServer.start: startup failed.');
        expect(Json.stringify(error)).to.not.include(materialized.dir);
        expect(starts).to.eql(0);
      } finally {
        await teardown(fixture);
      }
    });

    it('admits a present zero-byte hash ref and fails malformed ref authority before part reads', async () => {
      const fixture = await setup();
      let server: t.HttpServer.Started | undefined;
      try {
        const materialized = await Dist.materialize(fixture.args());
        expect(materialized.kind).to.eql('promoted');
        if (materialized.kind !== 'promoted') return;

        const dist = fixture.cloneDist();
        dist.hash.parts['empty.txt'] = `${HASH}:size=0`;
        const evidence = Object.freeze({ ...materialized.verification, dist });
        const reads: t.FsPkg.Dist.Pinned.ReadPart.Args[] = [];
        const zeroDeps: StartDependencies = {
          ...DEFAULT_DEPENDENCIES,
          verify: () => Promise.resolve({ kind: 'verified', evidence }),
          readPart(args) {
            reads.push(args);
            return Promise.resolve({ kind: 'read', bytes: new Uint8Array() });
          },
        };

        server = await startWith({
          dir: materialized.dir,
          integrity: materialized.integrity,
          limits: fixture.policy.verification,
          silent: true,
        }, zeroDeps);
        const empty = await fetch(`${server.origin}/empty.txt`);
        expect(empty.status).to.eql(200);
        expect(empty.headers.get('content-length')).to.eql('0');
        expect((await empty.arrayBuffer()).byteLength).to.eql(0);
        expect(reads.map(({ path, size }) => ({ path, size }))).to.eql([
          { path: 'empty.txt', size: 0 },
        ]);
        const until = reads[0]?.until;
        expect(until).to.eql(server.signal);
        await server.close('test.zero.complete');
        server = undefined;

        let malformedReads = 0;
        const validBacking = DEFAULT_DEPENDENCIES.fromDist({
          dist: evidence.dist,
          policy: Files.Policy.readonly('**'),
        });
        const malformedBacking = {
          ...validBacking,
          handlers: {
            ...validBacking.handlers,
            'files:read': () => ({
              kind: 'ref',
              file: { path: 'index.html', kind: 'file' },
              contentRef: { kind: 'hash', path: 'index.html', hash: HASH },
            }),
          },
        } as ReturnType<StartDependencies['fromDist']>;
        const malformedDeps: StartDependencies = {
          ...DEFAULT_DEPENDENCIES,
          verify: () => Promise.resolve({ kind: 'verified', evidence }),
          fromDist: () => malformedBacking,
          readPart() {
            malformedReads++;
            return Promise.resolve({ kind: 'io-failure' });
          },
        };
        server = await startWith({
          dir: materialized.dir,
          integrity: materialized.integrity,
          limits: fixture.policy.verification,
          silent: true,
        }, malformedDeps);

        const malformed = await fetch(server.origin);
        expect(malformed.status).to.eql(500);
        await malformed.body?.cancel();
        expect(malformedReads).to.eql(0);
      } finally {
        await server?.close('test.cleanup');
        await teardown(fixture);
      }
    });

    it('rejects hostile Host authority before Files lookup or pinned reads', async () => {
      const fixture = await setup();
      let server: t.HttpServer.Started | undefined;
      try {
        const materialized = await Dist.materialize(fixture.args());
        expect(materialized.kind).to.eql('promoted');
        if (materialized.kind !== 'promoted') return;

        let lookups = 0;
        let reads = 0;
        const backing = {
          handlers: {
            'files:read'() {
              lookups++;
              throw new Error('Host rejection must precede Files lookup.');
            },
          },
        } as unknown as t.FilesStatic.Readonly;
        const deps: StartDependencies = {
          ...DEFAULT_DEPENDENCIES,
          verify: () => Promise.resolve({ kind: 'verified', evidence: materialized.verification }),
          fromDist: () => backing,
          readPart() {
            reads++;
            return Promise.resolve({ kind: 'io-failure' });
          },
        };

        server = await startWith({
          dir: materialized.dir,
          integrity: materialized.integrity,
          limits: fixture.policy.verification,
          silent: true,
        }, deps);

        for (
          const host of [
            'evil.test',
            `0.0.0.0:${server.port}`,
            `[::]:${server.port}`,
            `localhost:${server.port},evil.test`,
            `localhost:${server.port + 1}`,
          ]
        ) {
          const response = await server.app.request(
            new Request('http://local.invalid/', { headers: { host } }),
          );
          expect([host, response.status]).to.eql([host, 421]);
          await response.body?.cancel();
        }
        expect({ lookups, reads }).to.eql({ lookups: 0, reads: 0 });

        const ipv6 = acceptedAuthorities({
          hostname: '::1',
          port: 4040,
          addr: { hostname: '::1' },
        });
        expect([...ipv6].sort()).to.eql(['[::1]:4040', 'localhost:4040']);

        const defaultHttp = acceptedAuthorities({
          hostname: 'localhost',
          port: 80,
          addr: { hostname: '127.0.0.1' },
        });
        expect([...defaultHttp].sort()).to.eql([
          '127.0.0.1',
          '127.0.0.1:80',
          'localhost',
          'localhost:80',
        ]);
      } finally {
        await server?.close('test.cleanup');
        await teardown(fixture);
      }
    });

    it('maps pinned-read failures without weakening authenticated authority', async () => {
      const fixture = await setup();
      let server: t.HttpServer.Started | undefined;
      try {
        const materialized = await Dist.materialize(fixture.args());
        expect(materialized.kind).to.eql('promoted');
        if (materialized.kind !== 'promoted') return;

        let failure: t.FsPkg.Dist.Pinned.ReadPart.FailureKind = 'symlink';
        const deps: StartDependencies = {
          ...DEFAULT_DEPENDENCIES,
          verify: () => Promise.resolve({ kind: 'verified', evidence: materialized.verification }),
          readPart: () => Promise.resolve({ kind: failure }),
        };
        server = await startWith({
          dir: materialized.dir,
          integrity: materialized.integrity,
          limits: fixture.policy.verification,
          silent: true,
        }, deps);

        const cases: readonly [t.FsPkg.Dist.Pinned.ReadPart.FailureKind, number][] = [
          ['missing', 404],
          ['content-mismatch', 412],
          ['unsafe-path', 412],
          ['symlink', 412],
          ['changed', 412],
          ['cancelled', 499],
          ['invalid-input', 500],
          ['limit-exceeded', 500],
          ['unsupported', 500],
          ['io-failure', 500],
        ];
        for (const [kind, status] of cases) {
          failure = kind;
          const response = await fetch(server.origin);
          expect([kind, response.status]).to.eql([kind, status]);
          await response.body?.cancel();
        }
      } finally {
        await server?.close('test.cleanup');
        await teardown(fixture);
      }
    });

    it('ignores request abort and cancels a delayed admitted pinned read on server close', async () => {
      const fixture = await setup();
      let server: t.HttpServer.Started | undefined;
      try {
        const materialized = await Dist.materialize(fixture.args());
        expect(materialized.kind).to.eql('promoted');
        if (materialized.kind !== 'promoted') return;

        let observed = () => {};
        const called = new Promise<void>((resolve) => (observed = resolve));
        const deps: StartDependencies = {
          ...DEFAULT_DEPENDENCIES,
          verify: () => Promise.resolve({ kind: 'verified', evidence: materialized.verification }),
          readPart(args) {
            expect(args.until).to.eql(server?.signal);
            observed();
            return new Promise((resolve) => {
              const signal = args.until as AbortSignal;
              if (signal.aborted) return resolve({ kind: 'cancelled' });
              signal.addEventListener('abort', () => resolve({ kind: 'cancelled' }), {
                once: true,
              });
            });
          },
        };
        server = await startWith({
          dir: materialized.dir,
          integrity: materialized.integrity,
          limits: fixture.policy.verification,
          silent: true,
        }, deps);

        const request = new AbortController();
        let settled = false;
        const pending = Promise.resolve(server.app.request(
          new Request('http://local.invalid/', {
            headers: { host: `localhost:${server.port}` },
            signal: request.signal,
          }),
        ));
        void pending.then(
          () => (settled = true),
          () => (settled = true),
        );
        await called;
        request.abort('test.request-abort');
        await Time.wait(0);
        expect(settled).to.eql(false);

        await server.close('test.server-close');
        const response = await pending;
        expect(response.status).to.eql(499);
        await response.body?.cancel();
        server = undefined;
      } finally {
        await server?.close('test.cleanup');
        await teardown(fixture);
      }
    });

    it('does not classify structural near-misses as authentic startup errors', () => {
      expect(DistServer.Error.is({
        name: 'DistServer.StartError',
        reason: 'missing',
        message: 'DistServer.start: pinned generation is unavailable.',
      })).to.eql(false);
      expect(DistServer.Error.is(new Error('DistServer.start: startup failed.'))).to.eql(false);
    });
  });
});

function validInput(): t.DistServer.Start.Args {
  return {
    dir: '/tmp/dist-generation' as t.StringDir,
    integrity: HASH,
    limits: {
      manifestBytes: 1024,
      entries: 10,
      fileBytes: 1024,
      totalBytes: 4096,
    },
    silent: true,
  };
}

async function catchStart(
  fn: () => Promise<unknown>,
): Promise<t.DistServer.StartError | undefined> {
  try {
    await fn();
  } catch (cause) {
    return cause as t.DistServer.StartError;
  }
}
