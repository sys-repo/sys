import { Hash } from '@sys/crypto/hash';
import { Dist, DistServer } from '@sys/server/dist';
import { describe, expect, Fs, it, Str, type t } from '../../-test.ts';
import { Cell } from '../mod.ts';
import { type DistFixture, setupDistFixture } from './-u.dist.fixture.ts';
import { tempCell } from './u.fixture.ts';

const DIST_SERVICE = resolveDistServiceRef();
const DIST_SERVICE_CONFIG = './-config/dist.yaml';
const TRUSTED = ['@sys/'];

describe('Cell.Services (Dist lifecycle)', () => {
  describe('planning', () => {
    it('resolves trusted Dist service references through a local workspace path', async () => {
      const root = await Deno.realPath(await tempCell('services-dist-plan', descriptor()));
      const cell = await Cell.load(root);
      const plan = await Cell.Services.plan(cell, { trusted: TRUSTED });

      expect(plan.services[0].endpoint.source).to.eql('trusted');
      expect(plan.services[0].endpoint.use).to.eql('DistService');
      expect(plan.services[0].endpoint.from).to.eql(DIST_SERVICE.from);
      expect(plan.services[0].endpoint.specifier).to.eql(DIST_SERVICE.resolved);
      expect(plan.services[0].endpoint.specifier.startsWith('file:')).to.eql(true);
    });
  });

  describe('startup', () => {
    it('starts a configured Dist from a Cell service descriptor and serves its materialized payload', async () => {
      const root = await Deno.realPath(await tempCell('services-dist-start', descriptor()));
      const fixture = await setupDistFixture(root);
      let started: Awaited<ReturnType<typeof Cell.Services.start>> | undefined;

      try {
        const materialized = await Dist.materialize(fixture.args());
        expect(materialized.kind).to.eql('promoted');
        if (materialized.kind !== 'promoted') return;

        const dir = Fs.Path.relative(root, materialized.dir);
        const config = Fs.join(root, DIST_SERVICE_CONFIG);
        await Fs.write(
          config,
          distServiceConfig({
            dir,
            pin: materialized.pin,
            port: 0,
          }),
          { force: true },
        );

        const cell = await Cell.load(root);
        started = await Cell.Services.start(cell, { trusted: TRUSTED });
        const handle = started.services[0].handle as { readonly origin: string };
        const index = await fetch(handle.origin);
        const encoded = await fetch(`${handle.origin}/assets/data%20%231.txt`);

        expect(index.status).to.eql(200);
        expect(await index.text()).to.eql('<h1>neutral-dist</h1>');
        expect(encoded.status).to.eql(200);
        expect(await encoded.text()).to.eql('encoded path');
      } finally {
        await teardownDistTest(fixture, started);
      }
    });

    describe('failure boundaries', () => {
      const refused = ['legacy integrity', 'mixed authority', 'legacy scheme', 'document checksum'];
      for (const mode of refused) {
        it(`rejects ${mode} without repinning; the canonical config still starts`, async () => {
          const root = await Deno.realPath(await tempCell(`services-dist-${mode}`, descriptor()));
          const fixture = await setupDistFixture(root);
          let started: Awaited<ReturnType<typeof Cell.Services.start>> | undefined;
          try {
            const materialized = await Dist.materialize(fixture.args());
            expect(materialized.kind).to.eql('promoted');
            if (materialized.kind !== 'promoted') {
              throw new Error('Expected a promoted generation.');
            }
            const pin = materialized.pin;
            const checksum = Hash.sha256(fixture.manifestBytes);
            const config = Fs.join(root, DIST_SERVICE_CONFIG);
            const valid = distServiceConfig({
              dir: Fs.Path.relative(root, materialized.dir),
              pin,
              port: 0,
            });
            const pinYaml = `pin:\n  scheme: ${pin.scheme}\n  digest: ${pin.digest}`;
            let invalid = valid;
            if (mode === 'legacy integrity') {
              invalid = valid.replace(pinYaml, `integrity: ${checksum}`);
            }
            if (mode === 'mixed authority') invalid = `${valid}\nintegrity: ${checksum}\n`;
            if (mode === 'legacy scheme') invalid = valid.replace('sys.dist/v2', 'sys.dist/v1');
            if (mode === 'document checksum') {
              invalid = valid.replace(`digest: ${pin.digest}`, `digest: ${checksum}`);
            }
            expect(invalid).not.to.eql(valid);
            await Fs.write(config, invalid, { force: true });

            const cell = await Cell.load(root);
            const error = await catchError(async () => {
              started = await Cell.Services.start(cell, { trusted: TRUSTED });
            });
            expect(error?.message).to.eql("Cell.Services.start: failed to start service 'view'.");
            const cause = error?.cause;
            if (mode === 'document checksum') {
              expect(DistServer.Error.is(cause)).to.eql(true);
              if (!DistServer.Error.is(cause)) throw new Error('Expected a Dist startup error.');
              expect(cause.reason).to.eql('pin-mismatch');
            } else {
              expect((cause as Error | undefined)?.message).to.include(
                'DistService: invalid config',
              );
            }
            expect((await Fs.readText(config)).data).to.eql(invalid);

            await Fs.write(config, valid, { force: true });
            started = await Cell.Services.start(cell, { trusted: TRUSTED });
            expect(started.services.length).to.eql(1);
          } finally {
            await teardownDistTest(fixture, started, 'cell.dist.refusal.test');
          }
        });
      }

      it('rejects startup when Dist config escapes the Cell cwd', async () => {
        const root = await Deno.realPath(
          await tempCell('services-dist-start-escape', descriptor()),
        );
        const fixture = await setupDistFixture(root);
        let started: Awaited<ReturnType<typeof Cell.Services.start>> | undefined;

        try {
          const materialized = await Dist.materialize(fixture.args());
          expect(materialized.kind).to.eql('promoted');
          if (materialized.kind !== 'promoted') return;

          await Fs.write(
            Fs.join(root, DIST_SERVICE_CONFIG),
            distServiceConfig({ dir: '../escape', pin: materialized.pin, port: 0 }),
            { force: true },
          );
          const cell = await Cell.load(root);

          const error = await catchError(async () => {
            started = await Cell.Services.start(cell, { trusted: TRUSTED });
          });
          expect(error?.message).to.eql("Cell.Services.start: failed to start service 'view'.");
          expect((error?.cause as { message?: string } | undefined)?.message).to.eql(
            'DistService: dir escapes service cwd.',
          );
        } finally {
          await teardownDistTest(fixture, started);
        }
      });

      it('times out when startup budget is too small', async () => {
        await assertStartupTimeout(1);
      });

      it('unexpected timeout-case success → refusal assertion fails without leaking ownership', async () => {
        // Catch the intended assertion so the suite can reach Deno's leak sanitizers.
        const error = await catchError(() => assertStartupTimeout(15000));
        expect(error).to.include({
          name: 'AssertionError',
          actual: undefined,
          expected: "Cell.Services.start: failed to start service 'view'.",
        });
      });
    });
  });

  describe('cleanup ownership', () => {
    for (const failure of ['close only', 'close and fixture']) {
      it(`${failure} rejects → fixture teardown settles and cleanup causes survive`, async () => {
        const root = await Deno.realPath(
          await tempCell(`services-dist-cleanup-${failure}`, descriptor()),
        );
        const fixture = await setupDistFixture(root);
        const closeError = new Error('close failed');
        const fixtureError = new Error('fixture teardown failed');
        const events: string[] = [];
        let tornDown = false;
        try {
          const error = await catchError(() =>
            teardownDistTest({
              async teardown() {
                await fixture.teardown();
                tornDown = true;
                events.push('fixture');
                if (failure === 'close and fixture') throw fixtureError;
              },
            }, {
              close() {
                events.push('close');
                return Promise.reject(closeError);
              },
            })
          );
          expect(events).to.eql(['close', 'fixture']);
          if (failure === 'close only') {
            expect(error).to.equal(closeError);
          } else {
            expect(error).to.be.instanceOf(AggregateError);
            const errors = (error as AggregateError).errors;
            expect(errors.length).to.eql(2);
            expect(errors[0]).to.equal(closeError);
            expect(errors[1]).to.equal(fixtureError);
          }
        } finally {
          if (!tornDown) await fixture.teardown();
        }
      });
    }
  });

  describe('resources', () => {
    it('declares configured Dist TCP listeners through Cell.Resources', async () => {
      const root = await Deno.realPath(await tempCell('services-dist-resources', descriptor()));
      const fixture = await setupDistFixture(root);

      try {
        const materialized = await Dist.materialize(fixture.args());
        expect(materialized.kind).to.eql('promoted');
        if (materialized.kind !== 'promoted') return;

        const dir = Fs.Path.relative(root, materialized.dir);
        const config = Fs.join(root, DIST_SERVICE_CONFIG);
        await Fs.write(
          config,
          distServiceConfig({
            dir,
            pin: materialized.pin,
            port: 5050,
          }),
          { force: true },
        );

        const resources = await Cell.Services.resources(await Cell.load(root), {
          trusted: TRUSTED,
        });
        expect(resources.resources.map((entry) => entry.resource)).to.eql([
          { kind: 'tcp-listener', host: '127.0.0.1', port: 5050 },
        ]);
      } finally {
        await fixture.teardown();
      }
    });
  });
});

async function assertStartupTimeout(timeout: number) {
  // Preload the service endpoint so the budget tests DistService.start, not import overhead.
  const root = await Deno.realPath(
    await tempCell(`services-dist-start-timeout-${timeout}`, descriptor({ timeout })),
  );
  const fixture = await setupDistFixture(root);
  let started: Awaited<ReturnType<typeof Cell.Services.start>> | undefined;

  try {
    const materialized = await Dist.materialize(fixture.args());
    expect(materialized.kind).to.eql('promoted');
    if (materialized.kind !== 'promoted') return;

    await Fs.write(
      Fs.join(root, DIST_SERVICE_CONFIG),
      distServiceConfig({
        dir: Fs.Path.relative(root, materialized.dir),
        pin: materialized.pin,
        port: 0,
      }),
      { force: true },
    );

    const cell = await Cell.load(root);
    await Cell.Services.resources(cell, { trusted: TRUSTED });

    const error = await catchError(async () => {
      started = await Cell.Services.start(cell, { trusted: TRUSTED });
    });
    expect(error?.message).to.eql("Cell.Services.start: failed to start service 'view'.");
    expect((error?.cause as { message?: string } | undefined)?.message).to.contain(
      'startup timed out after',
    );
  } finally {
    await teardownDistTest(fixture, started);
  }
}

async function teardownDistTest(
  fixture: Pick<DistFixture, 'teardown'>,
  started?: Pick<Awaited<ReturnType<typeof Cell.Services.start>>, 'close'>,
  reason = 'cell.dist.test',
) {
  const failures: unknown[] = [];
  try {
    await started?.close(reason);
  } catch (cause) {
    failures.push(cause);
  }
  try {
    await fixture.teardown();
  } catch (cause) {
    failures.push(cause);
  }
  if (failures.length === 1) throw failures[0];
  if (failures.length > 1) {
    throw new AggregateError(failures, 'Cell Dist test cleanup failed.');
  }
}

function resolveDistServiceRef() {
  const candidates = ['jsr:@sys/server/dist/service', '@sys/server/dist/service'];
  for (const from of candidates) {
    try {
      const resolved = import.meta.resolve(from);
      if (!resolved.startsWith('file:')) continue;
      return { from, resolved };
    } catch {
      continue;
    }
  }

  throw new Error('Dist service should resolve to a local workspace module for this proof.');
}

function descriptor(overrides: Partial<{ from: string; timeout: number }> = {}) {
  const from = overrides.from ?? DIST_SERVICE.from;
  const timeout = overrides.timeout === undefined ? '' : `timeout: ${overrides.timeout}`;
  return Str.dedent(`
    kind: cell
    version: 1

    services:
      - name: view
        use: DistService
        from: '${from}'
        config: ${DIST_SERVICE_CONFIG}
        ${timeout}
  `).trimStart();
}

function distServiceConfig(options: {
  readonly dir: string;
  readonly pin: t.DistPin;
  readonly port: number;
}) {
  return Str.dedent(`
    name: neutral-dist
    dir: ${options.dir}
    pin:
      scheme: ${options.pin.scheme}
      digest: ${options.pin.digest}
    limits:
      manifestBytes: 1048576
      entries: 100
      fileBytes: 1048576
      totalBytes: 4194304
    hostname: 127.0.0.1
    port: ${options.port}
  `).trimStart();
}

async function catchError(fn: () => Promise<unknown>): Promise<Error | undefined> {
  try {
    await fn();
  } catch (error) {
    return error as Error;
  }
}
