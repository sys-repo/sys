import { Cli, describe, expect, Fs, it, Num, Testing } from '../../-test.ts';
import { WorkspaceCli } from '../mod.ts';
import { Fixture as DeltaFixture } from '../../m.delta/-test/u.fixture.ts';
import * as fixture from '../../m.upgrade/-test/u.fixture.ts';

describe('Workspace.Cli.run', () => {
  it('renders help without entering planning or apply flow', async () => {
    const empty = await WorkspaceCli.run({ argv: [] });
    const result = await WorkspaceCli.run({ argv: ['--help'] });

    expect(empty.kind).to.eql('help');
    expect(result.kind).to.eql('help');
    if (result.kind === 'help') {
      expect(result.text).to.include('@sys/workspace');
      expect(result.text).to.include('Usage');
      expect(result.text).to.include('Commands');
      expect(result.text).to.include('Examples');
      expect(result.text).to.include('upgrade');
      expect(result.text).to.include('dsl');
      expect(result.text).to.include('bump');
    }
  });

  it('renders help for the short -h alias', async () => {
    const result = await WorkspaceCli.run({ argv: ['-h'] });

    expect(result.kind).to.eql('help');
    if (result.kind === 'help') {
      expect(result.text).to.include('@sys/workspace');
      expect(result.text).to.include('Usage');
      expect(result.text).to.include('Examples');
    }
  });

  it('routes upgrade help without entering planning', async () => {
    const result = await silent(() => WorkspaceCli.run({ argv: ['upgrade', '-h'] }));

    expect(result.kind).to.eql('help');
    if (result.kind === 'help') {
      expect(result.text).to.include('@sys/workspace upgrade');
      expect(result.text).to.include('--prerelease');
      expect(result.text).to.include('--non-interactive');
      expect(result.text).to.include('--policy');
      expect(result.text).to.include('--dry-run');
      expect(result.text).to.include('--minimum-dependency-age');
    }
  });

  it('routes bump help without entering upgrade planning', async () => {
    const result = await silent(() => WorkspaceCli.run({ argv: ['bump', '-h'] }));

    expect(result.kind).to.eql('help');
    if (result.kind === 'help') {
      expect(result.text).to.include('@sys/workspace bump');
      expect(result.text).to.include('--since <git-ref>');
      expect(result.text).to.include('--from <pkg|path>');
      expect(result.text).to.include('--explain-delta');
    }
  });

  it('explains git-derived bump roots when requested', async () => {
    const { cwd } = await DeltaFixture.gitBaselineWorkspace();

    const { result, text } = await captureInfo(() =>
      WorkspaceCli.run({
        cwd,
        argv: ['bump', '--since', 'baseline', '--dry-run', '--explain-delta'],
      })
    );

    expect(result.kind).to.eql('bump');
    expect(Cli.stripAnsi(text)).to.include('delta      baseline → HEAD');
    expect(Cli.stripAnsi(text)).to.include('roots      @scope/a');
    expect(Cli.stripAnsi(text)).to.include('@scope/a • code/pkg-a ← needs bump');
    expect(Cli.stripAnsi(text)).to.include('Dry run only. No files updated.');
  });

  it('routes dsl help without entering upgrade planning', async () => {
    const result = await silent(() => WorkspaceCli.run({ argv: ['dsl', 'delta'] }));

    expect(result.kind).to.eql('help');
    if (result.kind === 'help') {
      const text = Cli.stripAnsi(result.text);
      expect(text).to.include('@sys/workspace dsl delta');
      expect(text).to.include('Usage');
      expect(text).to.include('Options');
      expect(text).to.include('Classification');
    }
  });

  it('routes dsl skill projection', async () => {
    const result = await silent(() =>
      WorkspaceCli.run({ argv: ['dsl', 'delta', '--format', 'skill'] })
    );

    expect(result.kind).to.eql('help');
    if (result.kind === 'help') {
      expect(result.text).to.eql(Cli.stripAnsi(result.text));
      expect(result.text).to.include('name: "sys-workspace-dsl-delta"');
    }
  });

  it('gives dsl help precedence over format projection', async () => {
    const result = await silent(() =>
      WorkspaceCli.run({ argv: ['dsl', 'delta', '--format', 'skill', '-h'] })
    );

    expect(result.kind).to.eql('help');
    if (result.kind === 'help') {
      const text = Cli.stripAnsi(result.text);
      expect(text).to.include('@sys/workspace dsl delta');
      expect(text).to.include('Usage');
      expect(text).to.not.include('name: "sys-workspace-dsl-delta"');
    }
  });

  it('applies in non-interactive mode by default', async () => {
    const fs = await Testing.dir('WorkspaceCli.run.apply-default');
    await fixture.writeDepsYaml(
      fs,
      `
      deno.json:
        - import: jsr:@std/path@1.0.7
        - import: npm:react@18.2.0
    `,
    );
    await Fs.writeJson(fs.join('deno.json'), {
      name: 'cli-plan-app',
      tasks: { dev: 'deno task dev' },
    });

    await fixture.withVersions(
      {
        jsr: {
          '@std/path': fixture.versionsJsr('@std/path', '1.0.8', { '1.0.7': {}, '1.0.8': {} }),
        },
        npm: {
          react: fixture.versionsNpm('react', '19.0.0', {
            '18.2.0': {},
            '19.0.0': { publishedAt: fixture.standdownTime.older },
          }),
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

            const result = await WorkspaceCli.run({
              cwd: fs.dir,
              argv: ['upgrade', '--non-interactive', '--policy', 'latest'],
            });

            const afterDeps = await Fs.readText(fs.join('deps.yaml'));

            expect(result.kind).to.eql('apply');
            if (result.kind === 'apply') {
              expect(result.options).to.eql({
                deps: fs.join('deps.yaml'),
                mode: 'non-interactive',
                policy: 'latest',
                prerelease: false,
                minimumDependencyAge: 2 * fixture.standdownTime.day,
                evaluatedAt: result.options.evaluatedAt,
                include: [],
                exclude: [],
                dryRun: false,
              });
              expect(Num.Is.finite(result.options.evaluatedAt)).to.eql(true);
              expect(result.selection).to.eql({ include: [], exclude: [] });
              expect(result.upgrade.totals).to.eql({
                dependencies: 2,
                allowed: 2,
                blocked: 0,
                planned: 2,
              });
            }
            expect(afterDeps.data).to.not.eql(beforeDeps.data);
            expect(afterDeps.data).to.include('jsr:@std/path@1.0.8');
            expect(afterDeps.data).to.include('npm:react@19.0.0');
          },
        );
      },
    );
  });

  it('renders a non-interactive dry-run without mutating files', async () => {
    const fs = await Testing.dir('WorkspaceCli.run.plan');
    await fixture.writeDepsYaml(
      fs,
      `
      deno.json:
        - import: jsr:@std/path@1.0.7
        - import: npm:react@18.2.0
    `,
    );
    await Fs.writeJson(fs.join('deno.json'), {
      name: 'cli-apply-app',
      tasks: { dev: 'deno task dev' },
    });

    await fixture.withVersions(
      {
        jsr: {
          '@std/path': fixture.versionsJsr('@std/path', '1.0.8', { '1.0.7': {}, '1.0.8': {} }),
        },
        npm: {
          react: fixture.versionsNpm('react', '19.0.0', {
            '18.2.0': {},
            '19.0.0': { publishedAt: fixture.standdownTime.older },
          }),
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
              argv: ['upgrade', '--non-interactive', '--policy', 'latest', '--dry-run'],
            });
            const afterDeps = await Fs.readText(fs.join('deps.yaml'));
            const afterDeno = await Fs.readText(fs.join('deno.json'));

            expect(result.kind).to.eql('plan');
            if (result.kind === 'plan') {
              expect(result.options).to.eql({
                deps: fs.join('deps.yaml'),
                mode: 'non-interactive',
                policy: 'latest',
                prerelease: false,
                minimumDependencyAge: 2 * fixture.standdownTime.day,
                evaluatedAt: result.options.evaluatedAt,
                include: [],
                exclude: [],
                dryRun: true,
              });
              expect(Num.Is.finite(result.options.evaluatedAt)).to.eql(true);
              expect(result.selection).to.eql({ include: [], exclude: [] });
            }
            expect(afterDeps.data).to.eql(beforeDeps.data);
            expect(afterDeno.data).to.eql(beforeDeno.data);
          },
        );
      },
    );
  });

  it('disables npm standdown when minimum dependency age is 0', async () => {
    const fs = await Testing.dir('WorkspaceCli.run.minimum-age-zero');
    await fixture.writeDepsYaml(
      fs,
      `
      deno.json:
        - import: npm:motion@12.40.0
    `,
    );
    await Fs.writeJson(fs.join('deno.json'), { name: 'cli-minimum-age-zero-app' });

    await fixture.withVersions(
      {
        jsr: {},
        npm: {
          motion: fixture.versionsNpm('motion', '12.42.0', {
            '12.40.0': {},
            '12.42.0': {},
          }),
        },
      },
      async () => {
        await fixture.withInfo(
          {
            jsr: {},
            npm: { 'motion@12.42.0': fixture.infoNpm('motion', '12.42.0') },
          },
          async () => {
            const { result } = await captureInfo(() =>
              WorkspaceCli.run({
                cwd: fs.dir,
                argv: [
                  'upgrade',
                  '--non-interactive',
                  '--policy',
                  'latest',
                  '--dry-run',
                  '--minimum-dependency-age',
                  '0',
                ],
              })
            );

            expect(result.kind).to.eql('plan');
            if (result.kind === 'plan') {
              const decision = result.upgrade.policy.decisions[0]!;
              expect(result.options.minimumDependencyAge).to.eql(0);
              expect(result.upgrade.options.minimumDependencyAge).to.eql(0);
              expect(decision.ok).to.eql(true);
              if (decision.ok) expect(decision.selection.selected?.version).to.eql('12.42.0');
            }
          },
        );
      },
    );
  });

  it('uses include filters to constrain the applied upgrade set', async () => {
    const fs = await Testing.dir('WorkspaceCli.run.include');
    await fixture.writeDepsYaml(
      fs,
      `
      deno.json:
        - import: npm:react-dom@18.2.0
        - import: npm:react@18.2.0
    `,
    );
    await Fs.writeJson(fs.join('deno.json'), {
      name: 'cli-include-app',
      tasks: { dev: 'deno task dev' },
    });

    await fixture.withVersions(
      {
        jsr: {},
        npm: {
          'react-dom': fixture.versionsNpm('react-dom', '19.0.0', {
            '18.2.0': {},
            '19.0.0': { publishedAt: fixture.standdownTime.older },
          }),
          react: fixture.versionsNpm('react', '19.0.0', {
            '18.2.0': {},
            '19.0.0': { publishedAt: fixture.standdownTime.older },
          }),
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
              argv: ['upgrade', '--non-interactive', '--policy', 'latest', '--include', 'react'],
            });
            const depsText = await Fs.readText(fs.join('deps.yaml'));

            expect(result.kind).to.eql('apply');
            if (result.kind === 'apply') {
              expect(result.selection).to.eql({
                include: ['react'],
                exclude: ['react-dom'],
              });
            }
            expect(depsText.data).to.include('npm:react@19.0.0');
            expect(depsText.data).to.include('npm:react-dom@18.2.0');
          },
        );
      },
    );
  });

  it('passes prerelease opt-in through the non-interactive cli flow', async () => {
    const fs = await Testing.dir('WorkspaceCli.run.prerelease');
    await fixture.writeDepsYaml(
      fs,
      `
      deno.json:
        - import: npm:monaco-editor@0.55.1
    `,
    );
    await Fs.writeJson(fs.join('deno.json'), {
      name: 'cli-prerelease-app',
      tasks: { dev: 'deno task dev' },
    });

    await fixture.withVersions(
      {
        jsr: {},
        npm: {
          'monaco-editor': fixture.versionsNpm('monaco-editor', '0.56.0-dev-20260211', {
            '0.55.1': {},
            '0.56.0-dev-20260211': { publishedAt: fixture.standdownTime.older },
          }),
        },
      },
      async () => {
        await fixture.withInfo(
          {
            jsr: {},
            npm: {
              'monaco-editor@0.56.0-dev-20260211': fixture.infoNpm(
                'monaco-editor',
                '0.56.0-dev-20260211',
              ),
            },
          },
          async () => {
            const result = await WorkspaceCli.run({
              cwd: fs.dir,
              argv: ['upgrade', '--non-interactive', '--policy', 'latest', '--prerelease'],
            });

            expect(result.kind).to.eql('apply');
            if (result.kind === 'apply') {
              expect(result.options.prerelease).to.eql(true);
              expect(result.upgrade.collect.candidates[0]?.latest).to.eql('0.56.0-dev-20260211');
              expect(result.upgrade.policy.decisions[0]?.ok).to.eql(true);
              if (result.upgrade.policy.decisions[0]?.ok) {
                expect(result.upgrade.policy.decisions[0].selection.selected?.version).to.eql(
                  '0.56.0-dev-20260211',
                );
              }
            }
          },
        );
      },
    );
  });
});

async function silent<T>(fn: () => Promise<T>): Promise<T> {
  const info = console.info;
  console.info = () => undefined;

  try {
    return await fn();
  } finally {
    console.info = info;
  }
}

async function captureInfo<T>(
  fn: () => Promise<T>,
): Promise<{ readonly result: T; readonly text: string }> {
  const info = console.info;
  const lines: string[] = [];
  console.info = (...args: unknown[]) => {
    lines.push(args.map(String).join(' '));
  };

  try {
    const result = await fn();
    return { result, text: lines.join('\n') };
  } finally {
    console.info = info;
  }
}
