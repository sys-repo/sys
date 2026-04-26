import { describe, expect, it } from '../../../-test.ts';
import { Fs, type t } from '../common.ts';
import { resolveSandboxSummary } from '../u.resolve.sandbox.ts';

describe(`@sys/driver-agent/pi/cli/u.resolve.sandbox`, () => {
  it('builds the effective sandbox summary from launcher scope resolution', async () => {
    const prevTmp = Deno.env.get('TMPDIR');
    const cwd = '/tmp/pi-cli-test' as t.StringDir;
    try {
      Deno.env.set('TMPDIR', '/tmp/pi-cli-runtime');

      const res = await resolveSandboxSummary({
        cwd: { invoked: `${cwd}/nested` as t.StringDir, git: cwd },
        read: ['./canon' as t.StringPath],
        write: ['./out' as t.StringPath],
        context: {
          agents: 'walk-up',
          include: ['./AGENTS.md' as t.StringPath],
        },
      });

      expect(res.cwd).to.eql({ invoked: `${cwd}/nested`, git: cwd });
      expect(res.read?.summary).to.include.members(['cwd', 'runtime', 'context']);
      expect(res.read?.detail).to.include('./canon');
      expect(res.read?.detail).to.include(Fs.join(cwd, '.tmp', 'pi.cli', 'deno'));
      expect(res.read?.detail).to.include('/bin/bash');
      expect(res.write?.summary).to.include.members(['cwd', 'temp', 'extra']);
      expect(res.write?.detail).to.include('./out');
      expect(res.write?.detail).to.include('/tmp/pi-cli-runtime');
      expect(res.context?.agents).to.eql('walk-up');
      expect(res.context?.include).to.eql(['./AGENTS.md']);
      expect(res.context?.detail).to.include('./AGENTS.md');
      expect(res.context?.detail).to.include(Fs.join(cwd, 'AGENTS.md'));
      expect(res.context?.detail).not.to.include(Fs.join(cwd, '.git'));
      expect(res.context?.detail).not.to.include(Fs.join(cwd, '.agents', 'skills'));
    } finally {
      restoreEnv('TMPDIR', prevTmp);
    }
  });

  it('classifies the resolved tmp dir as temp even when the path is outside heuristic defaults', async () => {
    const prevTmp = Deno.env.get('TMPDIR');
    const cwd = '/tmp/pi-cli-test' as t.StringDir;
    try {
      Deno.env.set('TMPDIR', '/var/tmp/pi-cli-runtime');

      const res = await resolveSandboxSummary({
        cwd: { invoked: cwd, git: cwd },
        write: ['./out' as t.StringPath],
      });

      expect(res.write?.summary).to.include.members(['cwd', 'temp', 'extra']);
      expect(res.write?.detail).to.include('/var/tmp/pi-cli-runtime');
      expect(res.write?.detail).to.include('./out');
    } finally {
      restoreEnv('TMPDIR', prevTmp);
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
