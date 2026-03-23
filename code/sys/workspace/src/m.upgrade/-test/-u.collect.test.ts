import { describe, expect, it, Testing } from '../../-test.ts';
import { WorkspaceUpgrade } from '../mod.ts';
import { fetchFail, versionsJsr, versionsNpm, withVersions, writeDepsYaml } from './u.fixture.ts';

describe('Workspace.Upgrade.collect', () => {
  it('collects jsr and npm candidates from deps.yaml', async () => {
    const fs = await Testing.dir('WorkspaceUpgrade.collect');
    await writeDepsYaml(fs, `
      deno.json:
        - import: jsr:@sys/std@0.0.1
        - import: npm:react@18.2.0
    `);

    await withVersions(
      {
        jsr: { '@sys/std': versionsJsr('@sys/std', '0.0.3', { '0.0.1': {}, '0.0.3': {} }) },
        npm: { react: versionsNpm('react', '19.0.0', { '18.2.0': {}, '19.0.0': {} }) },
      },
      async () => {
        const result = await WorkspaceUpgrade.collect({ cwd: fs.dir, deps: fs.join('deps.yaml') });

        expect(result.totals).to.eql({
          dependencies: 2,
          collected: 2,
          skipped: 0,
          failed: 0,
        });
        expect(
          result.candidates.map((item) => [item.entry.module.name, item.current, item.latest]),
        ).to.eql([
          ['@sys/std', '0.0.1', '0.0.3'],
          ['react', '18.2.0', '19.0.0'],
        ]);
        expect(result.uncollected).to.eql([]);
      },
    );
  });

  it('skips unpinned dependencies before registry fetch', async () => {
    const fs = await Testing.dir('WorkspaceUpgrade.collect.unpinned');
    await writeDepsYaml(fs, `
      deno.json:
        - import: jsr:@sys/std
    `);

    await withVersions({ jsr: {}, npm: {} }, async () => {
      const result = await WorkspaceUpgrade.collect({ cwd: fs.dir, deps: fs.join('deps.yaml') });
      expect(result.totals).to.eql({
        dependencies: 1,
        collected: 0,
        skipped: 1,
        failed: 0,
      });
      expect(result.uncollected[0]?.reason.code).to.eql('version:missing-current');
    });
  });

  it('respects registry selection and marks unsupported registries as skipped', async () => {
    const fs = await Testing.dir('WorkspaceUpgrade.collect.registry-filter');
    await writeDepsYaml(fs, `
      deno.json:
        - import: jsr:@sys/std@0.0.1
        - import: npm:react@18.2.0
    `);

    await withVersions(
      {
        jsr: { '@sys/std': versionsJsr('@sys/std', '0.0.2', { '0.0.1': {}, '0.0.2': {} }) },
        npm: {},
      },
      async () => {
        const result = await WorkspaceUpgrade.collect(
          { cwd: fs.dir, deps: fs.join('deps.yaml') },
          { policy: { mode: 'minor' }, registries: ['jsr'] },
        );

        expect(result.totals).to.eql({
          dependencies: 2,
          collected: 1,
          skipped: 1,
          failed: 0,
        });
        expect(result.uncollected[0]?.reason.code).to.eql('registry:unsupported');
      },
    );
  });

  it('records registry fetch failures without aborting the whole pass', async () => {
    const fs = await Testing.dir('WorkspaceUpgrade.collect.fetch-fail');
    await writeDepsYaml(fs, `
      deno.json:
        - import: jsr:@sys/std@0.0.1
        - import: npm:react@18.2.0
    `);

    await withVersions(
      {
        jsr: { '@sys/std': versionsJsr('@sys/std', '0.0.2', { '0.0.1': {}, '0.0.2': {} }) },
        npm: { react: fetchFail('https://registry.npmjs.org/react') },
      },
      async () => {
        const result = await WorkspaceUpgrade.collect({ cwd: fs.dir, deps: fs.join('deps.yaml') });
        expect(result.totals).to.eql({
          dependencies: 2,
          collected: 1,
          skipped: 0,
          failed: 1,
        });
        expect(result.uncollected[0]?.reason.code).to.eql('registry:fetch');
      },
    );
  });

  it('returns a deps load failure when the manifest cannot be loaded', async () => {
    const fs = await Testing.dir('WorkspaceUpgrade.collect.missing-deps');
    const result = await WorkspaceUpgrade.collect({ cwd: fs.dir, deps: fs.join('missing.yaml') });

    expect(result.totals).to.eql({
      dependencies: 0,
      collected: 0,
      skipped: 0,
      failed: 1,
    });
    expect(result.uncollected[0]?.reason.code).to.eql('deps:load');
  });
});
