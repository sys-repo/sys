import { Fs, pkg } from '../../-test.ts';
import { Vite } from '../mod.ts';
import type { SerializedBuild } from './u.fixture.build.ts';

const [cwd, resultPath] = Deno.args;
if (!cwd || !resultPath) throw new Error('Expected build cwd and result path');

const build = await Vite.build({
  cwd,
  pkg,
  silent: true,
  spinner: false,
  exitOnError: false,
});

const result = {
  ok: build.ok,
  elapsed: build.elapsed,
  paths: {
    cwd: build.paths.cwd,
    app: { outDir: build.paths.app.outDir },
  },
  cmd: {
    output: {
      text: {
        stdout: build.cmd.output.text.stdout,
        stderr: build.cmd.output.text.stderr,
      },
    },
  },
} satisfies SerializedBuild;

await Fs.writeJson(resultPath, result);
