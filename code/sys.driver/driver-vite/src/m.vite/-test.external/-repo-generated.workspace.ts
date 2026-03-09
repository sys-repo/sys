import { describe, expect, Fs, it, type t } from '../../-test.ts';
import { workspaceRoot } from './u.fixture.ts';
import { buildGeneratedWorkspaceRepo } from './u.fixture.tmpl.ts';

describe('Vite external smoke (repo-generated workspace)', () => {
  it('build: generated tmpl.repo sibling packages compose through workspace imports', async () => {
    const repoTemplateDir = Fs.join(await workspaceRoot(), 'code', '-tmpl', '-templates', 'tmpl.repo');
    const { rootDir, fooDir, barDir, generateFoo, generateBar, patch, bootstrap, build } =
      await buildGeneratedWorkspaceRepo({
        sampleName: 'Vite.repo.generated.workspace',
        repoTemplateDir,
      });

    assertTaskOk(generateFoo, 'Generated foo project creation failed');
    assertTaskOk(generateBar, 'Generated bar project creation failed');
    assertTaskOk(patch, 'Generated workspace patch failed');
    assertTaskOk(bootstrap, 'Generated workspace bootstrap failed');

    expect(await Fs.exists(Fs.join(fooDir, 'deno.json'))).to.eql(true);
    expect(await Fs.exists(Fs.join(barDir, 'deno.json'))).to.eql(true);

    const fooDeno = (await Fs.readJson<t.DenoFileJson>(Fs.join(fooDir, 'deno.json'))).data;
    const barDeno = (await Fs.readJson<t.DenoFileJson>(Fs.join(barDir, 'deno.json'))).data;
    expect(fooDeno?.name).to.eql('@tmp/foo');
    expect(barDeno?.name).to.eql('@tmp/bar');

    assertTaskOk(build, 'Generated workspace project build failed');
    expect(await Fs.exists(Fs.join(fooDir, 'dist'))).to.eql(true);
    expect(await Fs.exists(Fs.join(fooDir, 'dist', 'index.html'))).to.eql(true);
    expect(rootDir.length > 0).to.eql(true);
  });
});

function assertTaskOk(
  task: {
    cwd: string;
    cmd: readonly string[];
    ok: boolean;
    code: number;
    stdout: string;
    stderr: string;
  },
  message: string,
) {
  if (task.ok) return;

  throw new Error(
    `${message} (code ${task.code})\n` +
      `cwd: ${task.cwd}\n` +
      `cmd: deno ${task.cmd.join(' ')}\n\n` +
      `stdout:\n${task.stdout}\n\nstderr:\n${task.stderr}`,
  );
}
