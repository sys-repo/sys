import { describe, expect, it, Testing, type t } from '../../-test.ts';
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

  it('emits cumulative registry progress with clipped per-registry counts', async () => {
    const fs = await Testing.dir('WorkspaceUpgrade.collect.progress');
    await writeDepsYaml(fs, `
      deno.json:
        - import: jsr:@sys/std@0.0.1
        - import: npm:react@18.2.0
        - import: npm:react-dom@18.2.0
    `);

    await withVersions(
      {
        jsr: { '@sys/std': versionsJsr('@sys/std', '0.0.3', { '0.0.1': {}, '0.0.3': {} }) },
        npm: {
          react: versionsNpm('react', '19.0.0', { '18.2.0': {}, '19.0.0': {} }),
          'react-dom': versionsNpm('react-dom', '19.0.0', { '18.2.0': {}, '19.0.0': {} }),
        },
      },
      async () => {
        const progress: t.WorkspaceUpgrade.Progress[] = [];

        await WorkspaceUpgrade.collect(
          { cwd: fs.dir, deps: fs.join('deps.yaml') },
          {
            policy: { mode: 'latest' },
            progress: (item) => progress.push(item),
          },
        );

        expect(progress).to.eql([
          {
            kind: 'registry',
            registry: 'jsr',
            current: { jsr: 1, npm: 0 },
            total: { jsr: 1, npm: 2 },
            completed: 1,
            dependencies: 3,
          },
          {
            kind: 'registry',
            registry: 'npm',
            current: { jsr: 1, npm: 1 },
            total: { jsr: 1, npm: 2 },
            completed: 2,
            dependencies: 3,
          },
          {
            kind: 'registry',
            registry: 'npm',
            current: { jsr: 1, npm: 2 },
            total: { jsr: 1, npm: 2 },
            completed: 3,
            dependencies: 3,
          },
        ]);
      },
    );
  });

  it('filters prerelease versions out of collected upgrade candidates', async () => {
    const fs = await Testing.dir('WorkspaceUpgrade.collect.released-only');
    await writeDepsYaml(fs, `
      deno.json:
        - import: npm:@vitejs/plugin-react@5.1.4
        - import: npm:monaco-editor@0.55.1
    `);

    await withVersions(
      {
        jsr: {},
        npm: {
          '@vitejs/plugin-react': versionsNpm('@vitejs/plugin-react', '6.0.1', {
            '5.1.4': {},
            '5.2.0': {},
            '6.0.1': {},
          }),
          'monaco-editor': versionsNpm('monaco-editor', '0.56.0-dev-20260211', {
            '0.55.1': {},
            '0.56.0-dev-20260211': {},
          }),
        },
      },
      async () => {
        const result = await WorkspaceUpgrade.collect({ cwd: fs.dir, deps: fs.join('deps.yaml') });

        expect(
          result.candidates.map((item) => [item.entry.module.name, item.current, item.latest, item.available]),
        ).to.eql([
          ['@vitejs/plugin-react', '5.1.4', '6.0.1', ['6.0.1', '5.2.0', '5.1.4']],
          ['monaco-editor', '0.55.1', '0.55.1', ['0.55.1']],
        ]);
      },
    );
  });

  it('excludes deprecated npm versions from collected upgrade candidates', async () => {
    const fs = await Testing.dir('WorkspaceUpgrade.collect.npm-deprecated');
    await writeDepsYaml(fs, `
      deno.json:
        - import: npm:react-spinners@0.17.0
    `);

    await withVersions(
      {
        jsr: {},
        npm: {
          'react-spinners': versionsNpm('react-spinners', '0.17.0', {
            '0.17.0': {},
            '1.0.0': { deprecated: "this version is incorrectly published. This package's major version is 0" },
          }),
        },
      },
      async () => {
        const result = await WorkspaceUpgrade.collect(
          { cwd: fs.dir, deps: fs.join('deps.yaml') },
          { policy: { mode: 'latest' } },
        );

        expect(
          result.candidates.map((item) => [item.entry.module.name, item.current, item.latest, item.available]),
        ).to.eql([
          ['react-spinners', '0.17.0', '0.17.0', ['0.17.0']],
        ]);
      },
    );
  });

  it('caps npm upgrade candidates at the registry latest dist-tag lane', async () => {
    const fs = await Testing.dir('WorkspaceUpgrade.collect.npm-latest-cap');
    await writeDepsYaml(fs, `
      deno.json:
        - import: npm:react-spinners@0.17.0
    `);

    await withVersions(
      {
        jsr: {},
        npm: {
          'react-spinners': versionsNpm('react-spinners', '0.17.0', {
            '0.17.0': {},
            '0.18.0': {},
          }),
        },
      },
      async () => {
        const result = await WorkspaceUpgrade.collect(
          { cwd: fs.dir, deps: fs.join('deps.yaml') },
          { policy: { mode: 'latest' } },
        );

        expect(
          result.candidates.map((item) => [item.entry.module.name, item.current, item.latest, item.available]),
        ).to.eql([
          ['react-spinners', '0.17.0', '0.17.0', ['0.17.0']],
        ]);
      },
    );
  });

  it('includes prerelease versions when explicitly enabled', async () => {
    const fs = await Testing.dir('WorkspaceUpgrade.collect.prerelease');
    await writeDepsYaml(fs, `
      deno.json:
        - import: npm:monaco-editor@0.55.1
    `);

    await withVersions(
      {
        jsr: {},
        npm: {
          'monaco-editor': versionsNpm('monaco-editor', '0.56.0-dev-20260211', {
            '0.55.1': {},
            '0.56.0-dev-20260211': {},
          }),
        },
      },
      async () => {
        const result = await WorkspaceUpgrade.collect(
          { cwd: fs.dir, deps: fs.join('deps.yaml') },
          { policy: { mode: 'latest' }, prerelease: true },
        );

        expect(
          result.candidates.map((item) => [item.entry.module.name, item.current, item.latest, item.available]),
        ).to.eql([
          ['monaco-editor', '0.55.1', '0.56.0-dev-20260211', ['0.56.0-dev-20260211', '0.55.1']],
        ]);
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
