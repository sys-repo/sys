import { describe, expect, Fs, it, Testing } from '../../-test.ts';
import { run } from '../u.run.ts';

describe('@sys/workspace/bump run', () => {
  it('returns a dry-run plan without writing files', async () => {
    const fs = await Testing.dir('WorkspaceBump.run.dryRun');
    const denoFilePath = await writeWorkspace(fs.dir);

    const res = await run({
      cwd: fs.dir,
      from: '@scope/a',
      dryRun: true,
      nonInteractive: true,
      log: false,
    });

    const denoJson = await Fs.readJson<{ version?: string }>(denoFilePath);
    expect(res.dryRun).to.eql(true);
    expect(res.apply).to.eql(undefined);
    expect(res.plan.root.name).to.eql('@scope/a');
    expect(denoJson.data?.version).to.eql('1.0.0');
  });

  it('applies the plan when a root is provided non-interactively', async () => {
    const fs = await Testing.dir('WorkspaceBump.run.apply');
    const denoFilePath = await writeWorkspace(fs.dir);
    const marker = Fs.join(fs.dir, '.after.txt');

    const res = await run({
      cwd: fs.dir,
      from: '@scope/a',
      nonInteractive: true,
      log: false,
      policy: {
        followups: ({ cwd }) => [{
          label: 'write marker',
          cmd: 'deno',
          args: ['eval', `await Deno.writeTextFile(${JSON.stringify(marker)}, ${JSON.stringify(cwd)})`],
          cwd,
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
});

async function writeWorkspace(cwd: string) {
  await Fs.writeJson(Fs.join(cwd, 'deno.json'), {
    workspace: ['code/pkg-a'],
  });

  const denoFilePath = Fs.join(cwd, 'code/pkg-a/deno.json');
  await Fs.writeJson(denoFilePath, {
    name: '@scope/a',
    version: '1.0.0',
    exports: { '.': './src/mod.ts' },
  });
  await Fs.write(Fs.join(cwd, 'code/pkg-a/src/mod.ts'), `export const a = 'a';\n`);
  return denoFilePath;
}
