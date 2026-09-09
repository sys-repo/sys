import { describe, expect, Fs, it, pkg, SAMPLE, Str } from '../../-test.ts';
import { Vite } from '../mod.ts';
import { writeLocalFixtureImports } from './u.bridge.fixture.ts';

const READY = 'SYS:VITE:STRICT-IN-PROCESS:READY';
const EXECUTION = 'SYS:VITE:STRICT-IN-PROCESS:EXECUTION';
const BUILD_OK = 'SYS:VITE:STRICT-IN-PROCESS:BUILD-OK';

console.info(READY);

describe('Vite strict in-process build fixture', () => {
  it('loads fixture config and completes the build body', async () => {
    console.info(EXECUTION);
    const fs = await SAMPLE.fs('Vite.strict-in-process-build-fixture');
    await Fs.remove(fs.dir);
    await Fs.copy(SAMPLE.Dirs.sampleBridge, fs.dir);
    const restore = await writeLocalFixtureImports(fs.dir);

    try {
      const build = await Vite.build({
        cwd: fs.dir,
        pkg,
        silent: true,
        spinner: false,
        exitOnError: false,
      });
      if (!build.ok) {
        throw new Error(
          Str.dedent(`
            Vite strict in-process fixture build failed.
            stderr: ${build.cmd.output.text.stderr || '(empty)'}
            stdout: ${build.cmd.output.text.stdout || '(empty)'}
          `),
        );
      }

      expect(build.ok).to.eql(true);
      console.info(BUILD_OK);
    } finally {
      await restore();
    }
  });
});
