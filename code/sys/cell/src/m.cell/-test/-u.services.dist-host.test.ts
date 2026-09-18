import { Dist } from '@sys/server/dist';
import { describe, expect, Fs, it, Str } from '../../-test.ts';
import { Cell } from '../mod.ts';
import { setupDistFixture } from './-u.dist.fixture.ts';
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
            integrity: materialized.integrity,
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
        await started?.close('cell.dist.test');
        await fixture.teardown();
      }
    });

    describe('failure boundaries', () => {
      it('rejects startup when Dist config escapes the Cell cwd', async () => {
        const root = await Deno.realPath(
          await tempCell('services-dist-start-escape', descriptor()),
        );
        const fixture = await setupDistFixture(root);

        try {
          const materialized = await Dist.materialize(fixture.args());
          expect(materialized.kind).to.eql('promoted');
          if (materialized.kind !== 'promoted') return;

          await Fs.write(
            Fs.join(root, DIST_SERVICE_CONFIG),
            distServiceConfig({ dir: '../escape', integrity: materialized.integrity, port: 0 }),
            { force: true },
          );
          const cell = await Cell.load(root);

          const error = await catchStart(() => Cell.Services.start(cell, { trusted: TRUSTED }));
          expect(error?.message).to.eql("Cell.Services.start: failed to start service 'view'.");
          expect((error?.cause as { message?: string } | undefined)?.message).to.eql(
            'DistService: dir escapes service cwd.',
          );
        } finally {
          await fixture.teardown();
        }
      });

      it('times out when startup budget is too small', async () => {
        // Keep timeout small to force startup budget pressure in DistService.start.
        // Preload the service endpoint so we isolate this from import overhead.
        const root = await Deno.realPath(
          await tempCell('services-dist-start-timeout', descriptor({ timeout: 1 })),
        );
        const fixture = await setupDistFixture(root);

        try {
          const materialized = await Dist.materialize(fixture.args());
          expect(materialized.kind).to.eql('promoted');
          if (materialized.kind !== 'promoted') return;

          await Fs.write(
            Fs.join(root, DIST_SERVICE_CONFIG),
            distServiceConfig({
              dir: Fs.Path.relative(root, materialized.dir),
              integrity: materialized.integrity,
              port: 0,
            }),
            { force: true },
          );

          const cell = await Cell.load(root);
          await Cell.Services.resources(cell, { trusted: TRUSTED });

          const error = await catchStart(async () => {
            await Cell.Services.start(cell, { trusted: TRUSTED });
          });
          expect(error?.message).to.eql("Cell.Services.start: failed to start service 'view'.");
          expect((error?.cause as { message?: string } | undefined)?.message).to.contain(
            'startup timed out after',
          );
        } finally {
          await fixture.teardown();
        }
      });
    });
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
            integrity: materialized.integrity,
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
  readonly integrity: string;
  readonly port: number;
}) {
  return Str.dedent(`
    name: neutral-dist
    dir: ${options.dir}
    integrity: ${options.integrity}
    limits:
      manifestBytes: 1048576
      entries: 100
      fileBytes: 1048576
      totalBytes: 4194304
    hostname: 127.0.0.1
    port: ${options.port}
  `).trimStart();
}

async function catchStart(fn: () => Promise<unknown>): Promise<Error | undefined> {
  try {
    await fn();
  } catch (error) {
    return error as Error;
  }
}
