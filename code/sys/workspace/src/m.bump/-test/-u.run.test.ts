import { Cli, describe, expect, Fs, it, Json, type t, Testing } from '../../-test.ts';
import { run, runWith } from '../u/u.run.ts';

const FS_MOD = new URL('../../../../fs/src/mod.ts', import.meta.url).href;
const fsWriteEval = (path: string, value: string) => {
  const mod = Json.stringify(FS_MOD);
  const args = [path, value].map((item) => Json.stringify(item)).join(', ');
  return `import { Fs } from ${mod}; await Fs.write(${args})`;
};

describe('@sys/workspace/bump run', () => {
  it('returns a dry-run plan without writing files', async () => {
    const fs = await Testing.dir('WorkspaceBump.run.dryRun');
    const [denoFilePath] = await writeWorkspace(fs.dir);

    const res = await run({
      cwd: fs.dir,
      from: ['@scope/a'],
      dryRun: true,
      nonInteractive: true,
      log: false,
    });

    const denoJson = await Fs.readJson<{ version?: string }>(denoFilePath);
    expect(res.dryRun).to.eql(true);
    expect(res.apply).to.eql(undefined);
    expect(res.plan.roots.map((root) => root.name)).to.eql(['@scope/a']);
    expect(denoJson.data?.version).to.eql('1.0.0');
  });

  it('applies the plan when a root is provided non-interactively', async () => {
    const fs = await Testing.dir('WorkspaceBump.run.apply');
    const [denoFilePath] = await writeWorkspace(fs.dir);
    const marker = Fs.join(fs.dir, '.after.txt');

    const res = await run({
      cwd: fs.dir,
      from: ['@scope/a'],
      nonInteractive: true,
      log: false,
      policy: {
        followups: ({ cwd }) => [{
          label: 'write marker',
          cmd: 'deno',
          args: ['eval', fsWriteEval(marker, cwd)],
        }],
      },
    });

    const denoJson = await Fs.readJson<{ version?: string }>(denoFilePath);
    const followup = await Fs.readText(marker);
    expect(res.dryRun).to.eql(false);
    expect(res.apply?.writes).to.have.length(1);
    expect(denoJson.data?.version).to.eql('1.0.1');
    expect(followup.data).to.eql(fs.dir);
  });

  it('returns a clean no-op for explicit empty precomputed roots', async () => {
    const collect: t.WorkspaceBump.CollectResult = {
      cwd: '/tmp/workspace',
      release: 'patch',
      orderedPaths: ['code/pkg-a'],
      edges: [],
      candidates: [{
        pkgPath: 'code/pkg-a',
        denoFilePath: '/tmp/workspace/code/pkg-a/deno.json',
        name: '@scope/a',
        version: {
          current: { major: 1, minor: 0, patch: 0, prerelease: [], build: [] },
          next: { major: 1, minor: 0, patch: 1, prerelease: [], build: [] },
        },
      }],
    };

    const res = await run({ collect, from: [], dryRun: true, log: false });

    expect(res.dryRun).to.eql(true);
    expect(res.plan).to.eql({ roots: [], selected: [], selectedPaths: [] });
    expect(res.apply).to.eql(undefined);
  });

  it('prechecks suggested interactive roots without skipping selection', async () => {
    const fs = await Testing.dir('WorkspaceBump.run.suggested');
    await writeWorkspace(fs.dir, true);
    let promptOptions: readonly { readonly value: string; readonly checked?: boolean }[] = [];
    const res = await runWith(
      {
        promptCheckbox: (input) => {
          const options = input.options as readonly {
            readonly value: t.StringPath;
            readonly checked?: boolean;
          }[];
          promptOptions = options;
          const picked = options.filter((option) => option.checked).map((option) => option.value);
          return Promise.resolve(picked);
        },
        promptSelect: Cli.Input.Select.prompt,
      },
      {
        cwd: fs.dir,
        suggestedRoots: ['@scope/b'],
        dryRun: true,
        log: false,
      },
    );

    expect(promptOptions.map((option) => [option.value, option.checked ?? false])).to.eql([
      ['code/pkg-a', false],
      ['code/pkg-b', true],
    ]);
    expect(res.plan.roots.map((root) => root.name)).to.eql(['@scope/b']);
    expect(res.dryRun).to.eql(true);
  });

  it('applies one cumulative multi-root plan once', async () => {
    const fs = await Testing.dir('WorkspaceBump.run.multiRoot');
    const [aPath, bPath] = await writeWorkspace(fs.dir, true);

    const res = await run({
      cwd: fs.dir,
      from: ['@scope/b', '@scope/a'],
      nonInteractive: true,
      log: false,
    });

    if (!bPath) throw new Error('Expected second package path');
    const a = await Fs.readJson<{ version?: string }>(aPath);
    const b = await Fs.readJson<{ version?: string }>(bPath);
    expect(res.dryRun).to.eql(false);
    expect(res.plan.roots.map((root) => root.name)).to.eql(['@scope/a', '@scope/b']);
    expect(res.apply?.writes).to.have.length(2);
    expect(a.data?.version).to.eql('1.0.1');
    expect(b.data?.version).to.eql('1.0.1');
  });

  it('lets interactive confirmation go back to root selection before saving', async () => {
    const fs = await Testing.dir('WorkspaceBump.run.back');
    const [aPath, bPath] = await writeWorkspace(fs.dir, true);
    const confirmMessages: string[] = [];
    const confirmOptions: string[][] = [];
    const confirmNames: string[][] = [];
    const promptChecked: string[][] = [];
    const res = await runWith(
      {
        promptCheckbox: (input) => {
          const options = input.options as readonly {
            readonly value: t.StringPath;
            readonly checked?: boolean;
          }[];
          promptChecked.push(
            options.filter((option) => option.checked).map((option) => option.value),
          );
          const picked = promptChecked.length === 1
            ? ['code/pkg-a' as t.StringPath]
            : ['code/pkg-b' as t.StringPath];
          return Promise.resolve(picked);
        },
        promptSelect: (input) => {
          const options = input.options as readonly {
            readonly name: string;
            readonly value: 'save' | 'back' | 'cancel';
          }[];
          confirmMessages.push(input.message ?? '');
          confirmOptions.push(options.map((option) => option.value));
          confirmNames.push(options.map((option) => Cli.stripAnsi(option.name)));
          const picked = confirmOptions.length === 1 ? 'back' : 'save';
          return Promise.resolve(picked);
        },
      },
      { cwd: fs.dir, log: false },
    );

    if (!bPath) throw new Error('Expected second package path');
    const a = await Fs.readJson<{ version?: string }>(aPath);
    const b = await Fs.readJson<{ version?: string }>(bPath);
    expect(confirmMessages).to.eql(['', '']);
    expect(confirmOptions).to.eql([
      ['save', 'back', 'cancel'],
      ['save', 'back', 'cancel'],
    ]);
    expect(confirmNames).to.eql([
      ['  save', '← reselect', '  cancel'],
      ['  save', '← reselect', '  cancel'],
    ]);
    expect(promptChecked).to.eql([[], ['code/pkg-a']]);
    expect(res.plan.roots.map((root) => root.name)).to.eql(['@scope/b']);
    expect(a.data?.version).to.eql('1.0.0');
    expect(b.data?.version).to.eql('1.0.1');
  });

  it('ignores ambient local files when checking unbumped packages', async () => {
    const fs = await Testing.dir('WorkspaceBump.run.unbumpedAmbientMutation');
    await writeWorkspace(fs.dir, true);
    const ambient = Fs.join(fs.dir, 'code/pkg-b/.DS_Store');

    const res = await run({
      cwd: fs.dir,
      from: ['@scope/a'],
      nonInteractive: true,
      log: false,
      policy: {
        followups() {
          return [{
            label: 'mutate ambient package file',
            cmd: 'deno',
            args: ['eval', fsWriteEval(ambient, 'ambient')],
          }];
        },
      },
    });

    expect(res.dryRun).to.eql(false);
  });

  it('fails when followups mutate an unbumped package', async () => {
    const fs = await Testing.dir('WorkspaceBump.run.unbumpedMutation');
    await writeWorkspace(fs.dir, true);
    const other = Fs.join(fs.dir, 'code/pkg-b/src/mod.ts');

    let err: Error | undefined;
    try {
      await run({
        cwd: fs.dir,
        from: ['@scope/a'],
        nonInteractive: true,
        log: false,
        policy: {
          followups: () => [{
            label: 'mutate other package',
            cmd: 'deno',
            args: ['eval', fsWriteEval(other, 'export const b = "b2";\n')],
          }],
        },
      });
    } catch (error) {
      err = error as Error;
    }

    expect(err?.message).to.include('Bump followups changed unbumped packages');
    expect(err?.message).to.include('@scope/b');
  });
});

async function writeWorkspace(cwd: string, withSecondPkg = false) {
  await Fs.writeJson(Fs.join(cwd, 'deno.json'), {
    workspace: withSecondPkg ? ['code/pkg-a', 'code/pkg-b'] : ['code/pkg-a'],
  });

  const denoFilePath = Fs.join(cwd, 'code/pkg-a/deno.json');
  await Fs.writeJson(denoFilePath, {
    name: '@scope/a',
    version: '1.0.0',
    exports: { '.': './src/mod.ts' },
  });
  await Fs.write(Fs.join(cwd, 'code/pkg-a/src/mod.ts'), `export const a = 'a';\n`);
  if (withSecondPkg) {
    const bPath = Fs.join(cwd, 'code/pkg-b/deno.json');
    await Fs.writeJson(bPath, {
      name: '@scope/b',
      version: '1.0.0',
      exports: { '.': './src/mod.ts' },
    });
    await Fs.write(Fs.join(cwd, 'code/pkg-b/src/mod.ts'), `export const b = 'b';\n`);
    return [denoFilePath, bPath] as const;
  }
  return [denoFilePath] as const;
}
