import { describe, expect, it } from '../../../-test.ts';
import { Fs, type t } from '../common.ts';
import { resolveRead } from '../u.resolve.read.ts';

describe(`@sys/driver-pi/pi/cli/u.resolve.read`, () => {
  it('returns runtime and explicit read scope without ambient context walk-up', async () => {
    const root = (await Fs.makeTempDir({ prefix: 'driver-pi.resolve.read.test.' }))
      .absolute as t.StringDir;
    const cwd = Fs.join(root, 'temp', 'foo') as t.StringDir;
    const denoDir = Fs.join(cwd, '.tmp', 'pi.cli', 'deno') as t.StringDir;
    const prevHome = Deno.env.get('HOME');
    const prevTmp = Deno.env.get('TMPDIR');

    try {
      Deno.env.set('HOME', root);
      Deno.env.set('TMPDIR', Fs.join(root, 'tmp'));
      await Fs.ensureDir(denoDir);
      await Fs.write(Fs.join(root, 'AGENTS.md'), '# root');
      await Fs.write(Fs.join(root, 'AGENTS.MD'), '# root uppercase');
      await Fs.ensureDir(Fs.join(root, '.agents', 'skills'));

      const paths = await resolveRead(cwd, denoDir, ['./extra-read' as t.StringPath]);
      expect(paths).to.include(cwd);
      expect(paths).to.include(denoDir);
      expect(paths).to.include('./extra-read');
      expect(paths).to.include('/bin/bash');
      expect(paths).to.include(Fs.join(root, 'tmp'));
      expect(paths).not.to.include(root);
      expect(paths).not.to.include(Fs.join(root, 'AGENTS.md'));
      expect(paths).not.to.include(Fs.join(root, 'AGENTS.MD'));
      expect(paths).not.to.include(Fs.join(root, '.agents', 'skills'));
    } finally {
      restoreEnv('HOME', prevHome);
      restoreEnv('TMPDIR', prevTmp);
      await Fs.remove(root);
    }
  });
});

function restoreEnv(name: string, value: string | undefined) {
  if (value === undefined) {
    Deno.env.delete(name);
    return;
  }
  Deno.env.set(name, value);
}
