import { describe, expect, Fs, it } from '../../../-test.ts';
import type { t } from '../../common.ts';
import { pullDistBundle } from '../u.pull/u.pull.dist.ts';
import { usingDistServer } from './u.dist.fixture.ts';

describe('cli.pull/u.bundle → pinned Dist settlement', () => {
  it('preserves immutable generation truth when mutable create projection is occupied', async () => {
    await usingDistServer(async (fixture) => {
      const root = await Fs.makeTempDir({ prefix: 'sys.tools.pull.dist.settlement.' });
      const baseDir = await Fs.realPath(root.absolute) as t.StringDir;
      const projectDir = Fs.join(baseDir, 'view/app');
      try {
        await Fs.ensureDir(projectDir);
        await Fs.write(Fs.join(projectDir, 'keep.txt'), 'keep', { force: true });
        const result = await pullDistBundle(
          baseDir,
          {
            kind: 'dist',
            manifest: fixture.manifest,
            integrity: fixture.integrity,
            store: './.dist-store',
            project: { dir: './view/app', mode: 'create' },
          },
          { silent: true },
        );

        expect(result.ok).to.eql(false);
        expect(result.kind).to.eql('projection-failed');
        if (result.kind !== 'projection-failed') throw new Error('expected projection failure');
        expect(result.generation.kind).to.eql('promoted');
        expect(result.generation.verification.integrity).to.eql(fixture.integrity);
        expect(result.projection.reason).to.eql('target-occupied');
        const keep = await Fs.readText(Fs.join(projectDir, 'keep.txt'));
        expect(keep.data).to.eql('keep');
        expect(await Fs.exists(result.generation.dir)).to.eql(true);
      } finally {
        await Fs.remove(root.absolute);
      }
    });
  });

  it('latches cancellation between an existing generation and mutable projection', async () => {
    await usingDistServer(async (fixture) => {
      const root = await Fs.makeTempDir({ prefix: 'sys.tools.pull.dist.settlement.' });
      const baseDir = await Fs.realPath(root.absolute) as t.StringDir;
      const projectDir = Fs.join(baseDir, 'view/app');
      const baseBundle: t.PullTool.ConfigYaml.DistBundle = {
        kind: 'dist',
        manifest: fixture.manifest,
        integrity: fixture.integrity,
        store: './.dist-store',
      };

      try {
        const materialized = await pullDistBundle(baseDir, baseBundle, { silent: true });
        expect(materialized.ok).to.eql(true);
        expect(materialized.generation.kind).to.eql('promoted');

        await Fs.ensureDir(projectDir);
        await Fs.write(Fs.join(projectDir, 'keep.txt'), 'keep', { force: true });
        const requests = fixture.requests();
        const controller = new AbortController();
        const project = { dir: './view/app', mode: 'replace' } as const;
        const bundle: t.PullTool.ConfigYaml.DistBundle = {
          ...baseBundle,
          get project() {
            controller.abort('cancel before projection');
            return project;
          },
        };

        const result = await pullDistBundle(baseDir, bundle, {
          silent: true,
          until: controller.signal,
        });

        expect(result.ok).to.eql(false);
        expect(result.kind).to.eql('projection-failed');
        if (result.kind !== 'projection-failed') throw new Error('expected projection failure');
        expect(result.generation.kind).to.eql('existing');
        expect(result.projection.reason).to.eql('cancelled');
        expect(fixture.requests()).to.eql(requests);
        const keep = await Fs.readText(Fs.join(projectDir, 'keep.txt'));
        expect(keep.data).to.eql('keep');
      } finally {
        await Fs.remove(root.absolute);
      }
    });
  });

  it('returns stable materialization failure without projection authority', async () => {
    await usingDistServer(async (fixture) => {
      const root = await Fs.makeTempDir({ prefix: 'sys.tools.pull.dist.settlement.' });
      const baseDir = await Fs.realPath(root.absolute) as t.StringDir;
      try {
        const result = await pullDistBundle(
          baseDir,
          {
            kind: 'dist',
            manifest: fixture.manifest,
            integrity: `sha256-${'f'.repeat(64)}` as t.StringHash,
            store: './.dist-store',
            project: { dir: './view/app', mode: 'replace' },
          },
          { silent: true },
        );

        expect(result.ok).to.eql(false);
        expect(result.kind).to.eql('materialization-failed');
        if (result.kind !== 'materialization-failed') {
          throw new Error('expected materialization failure');
        }
        expect(result.generation.reason).to.eql('integrity-mismatch');
        expect(result.projection).to.eql({ kind: 'not-run' });
        expect(await Fs.exists(Fs.join(baseDir, 'view/app'))).to.eql(false);
      } finally {
        await Fs.remove(root.absolute);
      }
    });
  });
});
