import { describe, expect, Fs, it, type t } from '../../-test.ts';
import { buildGeneratedRepo } from './u.fixture.tmpl.ts';

describe('Vite external smoke (repo-generated)', () => {
  it('build: generated tmpl.repo project foo succeeds in external workspace', async () => {
    const { rootDir, fooDir, generate, build } = await buildGeneratedRepo({
      sampleName: 'Vite.repo.generated',
    });

    assertTaskOk(generate, 'Generated repo project creation failed');
    expect(await Fs.exists(Fs.join(fooDir, 'deno.json'))).to.eql(true);

    const denoJson = (await Fs.readJson<t.DenoFileJson>(Fs.join(fooDir, 'deno.json'))).data;
    expect(denoJson?.name).to.eql('@tmp/foo');

    assertTaskOk(build, 'Generated repo project build failed');
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
