import { describe, expect, Fs, it, Testing } from '../../-test.ts';
import { WorkspaceCli } from '../mod.ts';
import * as fixture from '../../m.upgrade/-test/u.fixture.ts';

describe('Workspace.Cli.run', () => {
  it('plans in non-interactive mode without mutating files', async () => {
    const fs = await Testing.dir('WorkspaceCli.run.plan');
    await fixture.writeDepsYaml(fs, `
      deno.json:
        - import: jsr:@std/path@1.0.7
        - import: npm:react@18.2.0
    `);
    await Fs.writeJson(fs.join('deno.json'), { name: 'cli-plan-app', tasks: { dev: 'deno task dev' } });

    await fixture.withVersions(
      {
        jsr: {
          '@std/path': fixture.versionsJsr('@std/path', '1.0.8', { '1.0.7': {}, '1.0.8': {} }),
        },
        npm: {
          react: fixture.versionsNpm('react', '19.0.0', { '18.2.0': {}, '19.0.0': {} }),
        },
      },
      async () => {
        await fixture.withInfo(
          {
            jsr: { '@std/path@1.0.8': fixture.infoJsr('@std/path', '1.0.8') },
            npm: { 'react@19.0.0': fixture.infoNpm('react', '19.0.0') },
          },
          async () => {
            const beforeDeps = await Fs.readText(fs.join('deps.yaml'));
            const beforeDeno = await Fs.readText(fs.join('deno.json'));

            const result = await WorkspaceCli.run({
              cwd: fs.dir,
              argv: ['--non-interactive', '--mode', 'latest'],
            });

            const afterDeps = await Fs.readText(fs.join('deps.yaml'));
            const afterDeno = await Fs.readText(fs.join('deno.json'));

            expect(result.kind).to.eql('plan');
            expect(result.options).to.eql({
              deps: fs.join('deps.yaml'),
              mode: 'non-interactive',
              policy: 'latest',
              prerelease: false,
              include: [],
              exclude: [],
              apply: false,
            });
            expect(result.selection).to.eql({ include: [], exclude: [] });
            expect(result.upgrade.totals).to.eql({
              dependencies: 2,
              allowed: 2,
              blocked: 0,
              planned: 2,
            });
            expect(afterDeps.data).to.eql(beforeDeps.data);
            expect(afterDeno.data).to.eql(beforeDeno.data);
          },
        );
      },
    );
  });

  it('applies in non-interactive mode when --apply is set', async () => {
    const fs = await Testing.dir('WorkspaceCli.run.apply');
    await fixture.writeDepsYaml(fs, `
      deno.json:
        - import: jsr:@std/path@1.0.7
        - import: npm:react@18.2.0
    `);
    await Fs.writeJson(fs.join('deno.json'), { name: 'cli-apply-app', tasks: { dev: 'deno task dev' } });

    await fixture.withVersions(
      {
        jsr: {
          '@std/path': fixture.versionsJsr('@std/path', '1.0.8', { '1.0.7': {}, '1.0.8': {} }),
        },
        npm: {
          react: fixture.versionsNpm('react', '19.0.0', { '18.2.0': {}, '19.0.0': {} }),
        },
      },
      async () => {
        await fixture.withInfo(
          {
            jsr: { '@std/path@1.0.8': fixture.infoJsr('@std/path', '1.0.8') },
            npm: { 'react@19.0.0': fixture.infoNpm('react', '19.0.0') },
          },
          async () => {
            const result = await WorkspaceCli.run({
              cwd: fs.dir,
              argv: ['--non-interactive', '--apply', '--mode', 'latest'],
            });
            const depsText = await Fs.readText(fs.join('deps.yaml'));

            expect(result.kind).to.eql('apply');
            if (result.kind === 'apply') {
              expect(result.applied.files.yaml.depsFilePath).to.eql(fs.join('deps.yaml'));
            }
            expect(depsText.data).to.include('jsr:@std/path@1.0.8');
            expect(depsText.data).to.include('npm:react@19.0.0');
          },
        );
      },
    );
  });

  it('uses include filters to constrain the applied upgrade set', async () => {
    const fs = await Testing.dir('WorkspaceCli.run.include');
    await fixture.writeDepsYaml(fs, `
      deno.json:
        - import: npm:react-dom@18.2.0
        - import: npm:react@18.2.0
    `);
    await Fs.writeJson(fs.join('deno.json'), { name: 'cli-include-app', tasks: { dev: 'deno task dev' } });

    await fixture.withVersions(
      {
        jsr: {},
        npm: {
          'react-dom': fixture.versionsNpm('react-dom', '19.0.0', { '18.2.0': {}, '19.0.0': {} }),
          react: fixture.versionsNpm('react', '19.0.0', { '18.2.0': {}, '19.0.0': {} }),
        },
      },
      async () => {
        await fixture.withInfo(
          {
            jsr: {},
            npm: {
              'react@19.0.0': fixture.infoNpm('react', '19.0.0'),
              'react-dom@19.0.0': fixture.infoNpm('react-dom', '19.0.0', { react: '^19.0.0' }),
            },
          },
          async () => {
            const result = await WorkspaceCli.run({
              cwd: fs.dir,
              argv: ['--non-interactive', '--apply', '--mode', 'latest', '--include', 'react'],
            });
            const depsText = await Fs.readText(fs.join('deps.yaml'));

            expect(result.selection).to.eql({
              include: ['react'],
              exclude: ['react-dom'],
            });
            expect(depsText.data).to.include('npm:react@19.0.0');
            expect(depsText.data).to.include('npm:react-dom@18.2.0');
          },
        );
      },
    );
  });

  it('passes prerelease opt-in through the non-interactive cli flow', async () => {
    const fs = await Testing.dir('WorkspaceCli.run.prerelease');
    await fixture.writeDepsYaml(fs, `
      deno.json:
        - import: npm:monaco-editor@0.55.1
    `);
    await Fs.writeJson(fs.join('deno.json'), { name: 'cli-prerelease-app', tasks: { dev: 'deno task dev' } });

    await fixture.withVersions(
      {
        jsr: {},
        npm: {
          'monaco-editor': fixture.versionsNpm('monaco-editor', '0.56.0-dev-20260211', {
            '0.55.1': {},
            '0.56.0-dev-20260211': {},
          }),
        },
      },
      async () => {
        await fixture.withInfo(
          {
            jsr: {},
            npm: {
              'monaco-editor@0.56.0-dev-20260211': fixture.infoNpm('monaco-editor', '0.56.0-dev-20260211'),
            },
          },
          async () => {
            const result = await WorkspaceCli.run({
              cwd: fs.dir,
              argv: ['--non-interactive', '--apply', '--mode', 'latest', '--prerelease'],
            });

            expect(result.options.prerelease).to.eql(true);
            expect(result.upgrade.collect.candidates[0]?.latest).to.eql('0.56.0-dev-20260211');
            expect(result.upgrade.policy.decisions[0]?.ok).to.eql(true);
            if (result.upgrade.policy.decisions[0]?.ok) {
              expect(result.upgrade.policy.decisions[0].selection.selected?.version).to.eql(
                '0.56.0-dev-20260211',
              );
            }
          },
        );
      },
    );
  });
});
