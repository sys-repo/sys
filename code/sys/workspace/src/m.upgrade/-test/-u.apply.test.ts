import { describe, expect, expectError, Fs, it, Testing } from '../../-test.ts';
import { WorkspaceUpgrade } from '../mod.ts';
import * as fixture from './u.fixture.ts';

describe('Workspace.Upgrade.apply', () => {
  it('plans and applies selected versions to deps.yaml and deno.json', async () => {
    const fs = await Testing.dir('WorkspaceUpgrade.apply');
    await fixture.writeDepsYaml(
      fs,
      `
      deno.json:
        - import: jsr:@std/path@1.0.7
        - import: npm:react@18.2.0
    `,
    );
    await Fs.writeJson(fs.join('deno.json'), {
      name: 'upgrade-app',
      tasks: { dev: 'deno task dev' },
    });

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
            jsr: {
              '@std/path@1.0.8': fixture.infoJsr('@std/path', '1.0.8'),
            },
            npm: {
              'react@19.0.0': fixture.infoNpm('react', '19.0.0'),
            },
          },
          async () => {
            const result = await WorkspaceUpgrade.apply(
              { cwd: fs.dir, deps: fs.join('deps.yaml') },
              { policy: { mode: 'latest' } },
            );

            const depsText = await Fs.readText(fs.join('deps.yaml'));
            const denoJson = await Fs.readJson<{
              imports?: Record<string, string>;
              tasks?: Record<string, string>;
            }>(fs.join('deno.json'));

            expect(result.upgrade.totals).to.eql({
              dependencies: 2,
              allowed: 2,
              blocked: 0,
              planned: 2,
            });
            expect(result.entries.map((entry) => entry.module.toString())).to.eql([
              'jsr:@std/path@1.0.8',
              'npm:react@19.0.0',
            ]);
            expect(result.files.yaml.depsFilePath).to.eql(fs.join('deps.yaml'));
            expect(result.files.deno.denoFilePath).to.eql(fs.join('deno.json'));
            expect(depsText.data).to.include('jsr:@std/path@1.0.8');
            expect(depsText.data).to.include('npm:react@19.0.0');
            expect(denoJson.data?.imports).to.eql({
              '@std/path': 'jsr:@std/path@1.0.8',
              react: 'npm:react@19.0.0',
            });
            expect(denoJson.data?.tasks).to.eql({ dev: 'deno task dev' });
          },
        );
      },
    );
  });

  it('refuses to write when the derived dependency graph is cyclic', async () => {
    const fs = await Testing.dir('WorkspaceUpgrade.apply.cycle');
    await fixture.writeDepsYaml(
      fs,
      `
      deno.json:
        - import: npm:a@1.0.0
        - import: npm:b@1.0.0
    `,
    );
    await Fs.writeJson(fs.join('deno.json'), {
      name: 'cycle-app',
      tasks: { dev: 'deno task dev' },
    });

    await fixture.withVersions(
      {
        jsr: {},
        npm: {
          a: fixture.versionsNpm('a', '2.0.0', { '1.0.0': {}, '2.0.0': {} }),
          b: fixture.versionsNpm('b', '2.0.0', { '1.0.0': {}, '2.0.0': {} }),
        },
      },
      async () => {
        await fixture.withInfo(
          {
            jsr: {},
            npm: {
              'a@2.0.0': fixture.infoNpm('a', '2.0.0', { b: '^2.0.0' }),
              'b@2.0.0': fixture.infoNpm('b', '2.0.0', { a: '^2.0.0' }),
            },
          },
          async () => {
            const beforeDeps = await Fs.readText(fs.join('deps.yaml'));
            const beforeDeno = await Fs.readText(fs.join('deno.json'));

            const error = await expectError(() =>
              WorkspaceUpgrade.apply(
                { cwd: fs.dir, deps: fs.join('deps.yaml') },
                { policy: { mode: 'latest' } },
              ),
            );

            const afterDeps = await Fs.readText(fs.join('deps.yaml'));
            const afterDeno = await Fs.readText(fs.join('deno.json'));

            expect(error.message).to.include('dependency graph is cyclic');
            expect(afterDeps.data).to.eql(beforeDeps.data);
            expect(afterDeno.data).to.eql(beforeDeno.data);
          },
        );
      },
    );
  });
});
