import { describe, expect, it, Json, StdPath } from '../../-test.ts';
import { Fs } from '../common.ts';
import { fixturePart, setup, teardown } from './-u.pinned.fixture.ts';

const CHILD = StdPath.fromFileUrl(
  new URL('./u.fixture.local.permission.process.ts', import.meta.url),
);
const decoder = new TextDecoder();

type ChildReport = Readonly<{
  ancestorDenied: true;
  verification: 'verified';
  read: 'read';
  bytes: number;
}>;

describe('Pkg.Dist.Local narrow read permission', () => {
  it('verifies and reads with permission for only the selected Dist root', async () => {
    const fixture = await setup();
    try {
      const part = fixturePart(fixture, 'assets/app.js');
      const dir = StdPath.relative(Fs.cwd(), fixture.dir);
      const args = [
        'run',
        '--frozen',
        '--cached-only',
        '--no-prompt',
        `--allow-read=${fixture.dir}`,
        CHILD,
        dir,
        part.path,
        part.checksum,
        String(part.size),
      ];
      expect(args.filter((value) => value.startsWith('--allow-'))).to.eql([
        `--allow-read=${fixture.dir}`,
      ]);

      const output = await new Deno.Command(Deno.execPath(), {
        args,
        cwd: Fs.cwd(),
        stdin: 'null',
        stdout: 'piped',
        stderr: 'piped',
      }).output();
      const stderr = decoder.decode(output.stderr);
      expect([output.success, output.code, stderr]).to.eql([true, 0, '']);

      const report = Json.parse<ChildReport>(decoder.decode(output.stdout));
      expect(report).to.eql({
        ancestorDenied: true,
        verification: 'verified',
        read: 'read',
        bytes: part.size,
      });
    } finally {
      await teardown(fixture);
    }
  });
});
