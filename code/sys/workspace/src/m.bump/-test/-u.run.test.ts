import { Cli, describe, expect, Fs, it, Json, Testing } from '../../-test.ts';
import { run } from '../u.run.ts';

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
    const prevCheckbox = Cli.Input.Checkbox.prompt;
    const prevSelect = Cli.Input.Select.prompt;
    const confirmMessages: string[] = [];
    const confirmOptions: string[][] = [];
    const confirmNames: string[][] = [];

    try {
      Object.defineProperty(Cli.Input.Checkbox, 'prompt', {
        configurable: true,
        value: async <TValue>() => {
          return (confirmOptions.length === 0 ? ['code/pkg-a'] : ['code/pkg-b']) as TValue[];
        },
      });
      Object.defineProperty(Cli.Input.Select, 'prompt', {
        configurable: true,
        value: async <TValue>(
          input: { message?: string; options: readonly { name: string; value: string }[] },
        ) => {
          confirmMessages.push(input.message ?? '');
          confirmOptions.push(input.options.map((option) => option.value));
          confirmNames.push(input.options.map((option) => Cli.stripAnsi(option.name)));
          return (confirmOptions.length === 1 ? 'back' : 'save') as TValue;
        },
      });

      const res = await run({ cwd: fs.dir, log: false });

      if (!bPath) throw new Error('Expected second package path');
      const a = await Fs.readJson<{ version?: string }>(aPath);
      const b = await Fs.readJson<{ version?: string }>(bPath);
      expect(confirmMessages).to.eql(['', '']);
      expect(confirmOptions).to.eql([
        ['save', 'back', 'cancel'],
        ['save', 'back', 'cancel'],
      ]);
      expect(confirmNames).to.eql([
        ['  save', '← back', '  cancel'],
        ['  save', '← back', '  cancel'],
      ]);
      expect(res.plan.roots.map((root) => root.name)).to.eql(['@scope/b']);
      expect(a.data?.version).to.eql('1.0.0');
      expect(b.data?.version).to.eql('1.0.1');
    } finally {
      Object.defineProperty(Cli.Input.Checkbox, 'prompt', {
        configurable: true,
        value: prevCheckbox,
      });
      Object.defineProperty(Cli.Input.Select, 'prompt', {
        configurable: true,
        value: prevSelect,
      });
    }
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
          followups: ({ cwd }) => [{
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
