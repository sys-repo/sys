import { Cli, describe, expect, expectError, Fs, it, Num, type t, Testing } from '../../-test.ts';
import { WorkspaceCli } from '../mod.ts';
import { runWith as runBumpWith } from '../../m.bump/u/u.run.ts';
import { Fixture as DeltaFixture } from '../../m.delta/-test/u.fixture.ts';
import { fromRefWith } from '../../m.delta/m.Git/u.fromRef.ts';
import * as fixture from '../../m.upgrade/-test/u.fixture.ts';
import type { UpgradeRegistryDependencies } from '../../m.upgrade/u.session.ts';
import {
  runWith,
  type WorkspaceCliDependencies,
  type WorkspaceCliDependencyOverrides,
} from '../m.run.ts';
import { runInteractiveWith } from '../u/u.interactive.ts';

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
    const result = await silent(() =>
      WorkspaceCli.run({ argv: ['upgrade', '-h'], finalizeUpgrade: unexpectedFinalization })
    );

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

  it('applies and suggests a commit without a caller finalizer', async () => {
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

    const registry = fixture.registry({
      versions: {
        jsr: {
          '@std/path': fixture.versionsJsr('@std/path', '1.0.8', {
            '1.0.7': {},
            '1.0.8': { createdAt: fixture.standdownTime.older },
          }),
        },
        npm: {
          react: fixture.versionsNpm('react', '19.0.0', {
            '18.2.0': {},
            '19.0.0': { publishedAt: fixture.standdownTime.older },
          }),
        },
      },
      info: {
        jsr: { '@std/path@1.0.8': fixture.infoJsr('@std/path', '1.0.8') },
        npm: { 'react@19.0.0': fixture.infoNpm('react', '19.0.0') },
      },
    });
    const beforeDeps = await Fs.readText(fs.join('deps.yaml'));

    const { result, text } = await captureInfo(() =>
      runWith(registryDependencies(registry), {
        cwd: fs.dir,
        argv: ['upgrade', '--non-interactive', '--policy', 'latest'],
      })
    );

    const afterDeps = await Fs.readText(fs.join('deps.yaml'));

    expect(text).to.include('chore(deps): upgraded 2 workspace dependencies');
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

    const registry = fixture.registry({
      versions: {
        jsr: {
          '@std/path': fixture.versionsJsr('@std/path', '1.0.8', {
            '1.0.7': {},
            '1.0.8': { createdAt: fixture.standdownTime.older },
          }),
        },
        npm: {
          react: fixture.versionsNpm('react', '19.0.0', {
            '18.2.0': {},
            '19.0.0': { publishedAt: fixture.standdownTime.older },
          }),
        },
      },
      info: {
        jsr: { '@std/path@1.0.8': fixture.infoJsr('@std/path', '1.0.8') },
        npm: { 'react@19.0.0': fixture.infoNpm('react', '19.0.0') },
      },
    });
    const beforeDeps = await Fs.readText(fs.join('deps.yaml'));
    const beforeDeno = await Fs.readText(fs.join('deno.json'));

    const result = await runWith(registryDependencies(registry), {
      cwd: fs.dir,
      argv: ['upgrade', '--non-interactive', '--policy', 'latest', '--dry-run'],
      finalizeUpgrade: unexpectedFinalization,
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
      expect(result.upgrade.totals).to.eql({
        dependencies: 2,
        allowed: 2,
        blocked: 0,
        planned: 2,
      });
    }
    expect(afterDeps.data).to.eql(beforeDeps.data);
    expect(afterDeno.data).to.eql(beforeDeno.data);
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

    const registry = fixture.registry({
      versions: {
        jsr: {},
        npm: {
          motion: fixture.versionsNpm('motion', '12.42.0', {
            '12.40.0': {},
            '12.42.0': {},
          }),
        },
      },
      info: {
        jsr: {},
        npm: { 'motion@12.42.0': fixture.infoNpm('motion', '12.42.0') },
      },
    });
    const { result } = await captureInfo(() =>
      runWith(registryDependencies(registry), {
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

    const registry = fixture.registry({
      versions: {
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
      info: {
        jsr: {},
        npm: {
          'react@19.0.0': fixture.infoNpm('react', '19.0.0'),
          'react-dom@19.0.0': fixture.infoNpm('react-dom', '19.0.0', { react: '^19.0.0' }),
        },
      },
    });
    const result = await runWith(registryDependencies(registry), {
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

    const registry = fixture.registry({
      versions: {
        jsr: {},
        npm: {
          'monaco-editor': fixture.versionsNpm('monaco-editor', '0.56.0-dev-20260211', {
            '0.55.1': {},
            '0.56.0-dev-20260211': { publishedAt: fixture.standdownTime.older },
          }),
        },
      },
      info: {
        jsr: {},
        npm: {
          'monaco-editor@0.56.0-dev-20260211': fixture.infoNpm(
            'monaco-editor',
            '0.56.0-dev-20260211',
          ),
        },
      },
    });
    const result = await runWith(registryDependencies(registry), {
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
  });
});

describe('Workspace.Cli.run: upgrade finalization', () => {
  const suggestion = 'suggested commit msg:';
  const commit = 'chore(deps): upgraded react';

  for (const mode of ['interactive', 'non-interactive'] as const) {
    it(`${mode}: pending finalizer → no handoff; success → one summary and suggestion`, async () => {
      const { deps, cwd, argv } = await upgradeFixture(mode);
      const entered = Promise.withResolvers<void>();
      const release = Promise.withResolvers<void>();
      const finalized: t.WorkspaceUpgrade.ApplyResult[] = [];
      const { result, text } = await captureInfo(async (output) => {
        let returned = false;
        const run = runWith(deps, {
          cwd,
          argv,
          finalizeUpgrade(applied) {
            finalized.push(applied);
            entered.resolve();
            return release.promise;
          },
        }).then((result) => {
          returned = true;
          return result;
        });
        try {
          await Promise.race([entered.promise, run]);
          expect(finalized.length).to.eql(1);
          const manifest = await Fs.readText(Fs.join(cwd, 'deps.yaml'));
          expect(manifest.data).to.include('npm:react@18.3.0');
          expect(returned).to.eql(false);
          expect(output()).to.not.include('Updated');
          expect(output()).to.not.include(suggestion);
        } finally {
          release.resolve();
          await run;
        }
        return await run;
      });
      expect(result.kind).to.eql('apply');
      if (result.kind === 'apply') expect(finalized).to.eql([result.applied]);
      expect(text.match(/\bUpdated\b/g)).to.eql(['Updated']);
      expect(text.match(/suggested commit msg:/g)).to.eql([suggestion]);
      expect(text).to.include(commit);
    });

    it(`${mode}: rejected finalizer → original error and no handoff`, async () => {
      const { deps, cwd, argv } = await upgradeFixture(mode);
      const failure = new Error('Finalization failed');
      const { result, text } = await captureInfo(() =>
        expectError(() =>
          runWith(deps, { cwd, argv, finalizeUpgrade: () => Promise.reject(failure) })
        )
      );
      expect(result).to.equal(failure);
      expect(text).to.not.include('Updated');
      expect(text).to.not.include(suggestion);
      const manifest = await Fs.readText(Fs.join(cwd, 'deps.yaml'));
      expect(manifest.data).to.include('npm:react@18.3.0');
    });
  }

  it('finalizes a successful apply with unchanged pins without suggesting a commit', async () => {
    const { deps, cwd, argv } = await upgradeFixture('non-interactive');
    let calls = 0;
    const { result, text } = await captureInfo(() =>
      runWith(deps, {
        cwd,
        argv: [...argv, '--policy', 'none'],
        finalizeUpgrade() {
          calls++;
          return Promise.resolve();
        },
      })
    );
    expect(result.kind).to.eql('apply');
    expect(calls).to.eql(1);
    expect(text).to.include('Updated');
    expect(text).to.not.include(suggestion);
  });

  it('empty interactive selection → no finalization', async () => {
    const { deps, cwd, argv } = await upgradeFixture('interactive', []);
    const result = await silent(() =>
      runWith(deps, { cwd, argv, finalizeUpgrade: unexpectedFinalization })
    );
    expect(result.kind).to.eql('plan');
  });

  it('does not finalize when apply fails', async () => {
    const { deps, cwd, argv } = await upgradeFixture('non-interactive');
    const failure = new Error('Apply failed');
    const result = await silent(() =>
      expectError(() =>
        runWith({ upgrade: { ...deps.upgrade, apply: () => Promise.reject(failure) } }, {
          cwd,
          argv,
          finalizeUpgrade: unexpectedFinalization,
        })
      )
    );
    expect(result).to.equal(failure);
  });
});

describe('Workspace.Cli.run: git-derived bumps', {
  permissions: { read: true, write: true, env: true, run: false },
}, () => {
  it('explains git-derived bump roots when requested', async () => {
    await Testing.withTmpDir(async (cwd) => {
      await DeltaFixture.workspace(cwd);
      const git = DeltaFixture.gitReads(cwd);
      const policy: t.WorkspaceBump.Policy = { couplings: [] };
      const deltaCalls: t.WorkspaceDelta.Git.FromRefArgs[] = [];
      const deltaFromRef: WorkspaceCliDependencies['deltaFromRef'] = (args) => {
        deltaCalls.push(args);
        return fromRefWith(git.invoke, args);
      };
      const { result, text } = await captureInfo(() =>
        runWith({ deltaFromRef }, {
          cwd,
          argv: [
            'bump',
            '--since',
            'baseline',
            '--dry-run',
            '--explain-delta',
            '--release',
            'minor',
          ],
          bumpPolicy: policy,
        })
      );

      git.assertCalls();
      expect(deltaCalls).to.eql([{ cwd, ref: 'baseline', release: 'minor', policy }]);
      expect(result.kind).to.eql('bump');
      if (result.kind === 'bump') {
        expect(result.bump.collect.release).to.eql('minor');
        expect(result.bump.plan.selectedPaths).to.eql(['code/pkg-a', 'code/pkg-c']);
        expect(result.bump.dryRun).to.eql(true);
      }
      expect(Cli.stripAnsi(text)).to.include('delta      baseline → HEAD');
      expect(Cli.stripAnsi(text)).to.include('roots      @scope/a');
      expect(Cli.stripAnsi(text)).to.include('@scope/a • code/pkg-a ← needs bump');
      expect(Cli.stripAnsi(text)).to.include('Dry run only. No files updated.');
    });
  });

  it('shows a compact delta prelude before default interactive bump selection', async () => {
    await Testing.withTmpDir(async (cwd) => {
      await DeltaFixture.workspace(cwd);
      const git = DeltaFixture.gitReads(cwd, 'jsr-publish');
      const deltaCalls: t.WorkspaceDelta.Git.FromRefArgs[] = [];
      const deltaFromRef: WorkspaceCliDependencies['deltaFromRef'] = (args) => {
        deltaCalls.push(args);
        return fromRefWith(git.invoke, args);
      };
      let promptOptions: readonly { readonly value: string; readonly checked?: boolean }[] = [];
      const bumpRun: WorkspaceCliDependencies['bumpRun'] = (args) =>
        runBumpWith(
          {
            promptCheckbox: (input) => {
              const options = input.options as readonly {
                readonly value: t.StringPath;
                readonly checked?: boolean;
              }[];
              promptOptions = options;
              const picked = options.filter((option) => option.checked).map((option) =>
                option.value
              );
              return Promise.resolve(picked);
            },
            promptSelect: Cli.Input.Select.prompt,
          },
          args,
        );
      const { result, text } = await captureInfo(() =>
        runWith({ bumpRun, deltaFromRef }, { cwd, argv: ['bump', '--dry-run'] })
      );
      const plain = Cli.stripAnsi(text);

      git.assertCalls();
      expect(deltaCalls).to.eql([{ cwd, ref: 'jsr-publish', release: 'patch', policy: undefined }]);
      expect(result.kind).to.eql('bump');
      if (result.kind === 'bump') {
        expect(result.bump.plan.selectedPaths).to.eql(['code/pkg-a', 'code/pkg-c']);
        expect(result.bump.dryRun).to.eql(true);
      }
      const checked = promptOptions.filter((option) => option.checked).map((option) =>
        option.value
      );
      expect(checked).to.eql(['code/pkg-a']);
      expect(plain).to.include('status     bump required');
      expect(plain).to.include('affected   2 packages');
      expect(plain).to.include('root       @scope/a');
      expect(plain).to.not.include('delta      jsr-publish → HEAD');
    });
  });
});

async function upgradeFixture(mode: t.WorkspaceCli.Mode, picked = ['react']) {
  const fs = await Testing.dir(`WorkspaceCli.run.finalize.${mode}`);
  await fixture.writeDepsYaml(
    fs,
    `
    deno.json:
      - import: npm:react@18.2.0
    `,
  );
  await Fs.writeJson(fs.join('deno.json'), { name: 'cli-finalization-app' });
  const registry = fixture.registry({
    versions: {
      jsr: {},
      npm: {
        react: fixture.versionsNpm('react', '18.3.0', {
          '18.2.0': {},
          '18.3.0': { publishedAt: fixture.standdownTime.older },
        }),
      },
    },
    info: { jsr: {}, npm: { 'react@18.3.0': fixture.infoNpm('react', '18.3.0') } },
  });
  const deps = {
    ...registryDependencies(registry),
    interactive: (input, options) =>
      runInteractiveWith(
        {
          createSession: () => fixture.session(registry),
          promptCheckbox: () => Promise.resolve(picked),
        },
        input,
        options,
      ),
  } satisfies WorkspaceCliDependencyOverrides;
  const argv = mode === 'interactive' ? ['upgrade'] : ['upgrade', '--non-interactive'];
  return { deps, cwd: fs.dir, argv };
}

function unexpectedFinalization(): Promise<void> {
  throw new Error('Unexpected upgrade finalization');
}

function registryDependencies(
  registry: UpgradeRegistryDependencies,
): Pick<WorkspaceCliDependencies, 'upgrade'> {
  return {
    upgrade: {
      collect: (input, options) => fixture.collect(registry, input, options),
      upgrade: (input, options) => fixture.upgrade(registry, input, options),
      apply: (input, options) => fixture.apply(registry, input, options),
    },
  };
}

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
  fn: (output: () => string) => Promise<T>,
): Promise<{ readonly result: T; readonly text: string }> {
  const info = console.info;
  const lines: string[] = [];
  const output = () => lines.join('\n');
  console.info = (...args: unknown[]) => {
    lines.push(Cli.stripAnsi(args.map(String).join(' ')));
  };

  try {
    const result = await fn(output);
    return { result, text: output() };
  } finally {
    console.info = info;
  }
}
