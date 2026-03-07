import { describe, expect, it } from '../../-test.ts';
import { Process } from '../mod.ts';

describe('Process.inherit', () => {
  const evalArgs = (code: string) => ['eval', code];

  it('returns success for a command that exits 0', async () => {
    const res = await Process.inherit({ args: evalArgs('Deno.exit(0)') });
    expect(res.code).to.eql(0);
    expect(res.success).to.eql(true);
    expect(res.signal).to.eql(null);
  });

  it('returns failure for a command that exits non-zero', async () => {
    const res = await Process.inherit({ args: evalArgs('Deno.exit(7)') });
    expect(res.code).to.eql(7);
    expect(res.success).to.eql(false);
    expect(res.signal).to.eql(null);
  });

  it('respects cwd', async () => {
    const cwd = await Deno.makeTempDir();
    try {
      const suffix = cwd.split('/').at(-1) ?? cwd;
      const script = `
        const expected = Deno.env.get('EXPECTED_CWD_SUFFIX') ?? '';
        Deno.exit(Deno.cwd().endsWith(expected) ? 0 : 1);
      `;
      const res = await Process.inherit({
        args: evalArgs(script),
        cwd,
        env: { EXPECTED_CWD_SUFFIX: suffix },
        silent: true, // NB: no-op for Process.inherit.
      });
      expect(res.success).to.eql(true);
      expect(res.code).to.eql(0);
    } finally {
      await Deno.remove(cwd, { recursive: true }).catch(() => undefined);
    }
  });

  it('respects env injection', async () => {
    const key = 'PROCESS_INHERIT_ENV_TEST';
    const script = `
      const value = Deno.env.get('${key}');
      Deno.exit(value === 'ok' ? 0 : 1);
    `;
    const res = await Process.inherit({
      args: evalArgs(script),
      env: { [key]: 'ok' },
    });
    expect(res.success).to.eql(true);
    expect(res.code).to.eql(0);
  });

  it('defaults FORCE_COLOR=1 (override allowed)', async () => {
    const defaultScript = `
      const value = Deno.env.get('FORCE_COLOR');
      Deno.exit(value === '1' ? 0 : 1);
    `;
    const overrideScript = `
      const value = Deno.env.get('FORCE_COLOR');
      Deno.exit(value === '0' ? 0 : 1);
    `;

    const a = await Process.inherit({ args: evalArgs(defaultScript) });
    expect(a.success).to.eql(true);
    expect(a.code).to.eql(0);

    const b = await Process.inherit({
      args: evalArgs(overrideScript),
      env: { FORCE_COLOR: '0' },
      silent: false, // NB: no-op for Process.inherit.
    });
    expect(b.success).to.eql(true);
    expect(b.code).to.eql(0);
  });

  it('passes through signal exits without normalization', async () => {
    const res = await Process.inherit({
      cmd: 'sh',
      args: ['-c', 'kill -TERM $$'],
    });

    expect(res.success).to.eql(false);
    expect(res.signal).to.eql('SIGTERM');
    expect(res.code).to.not.eql(0);
  });
});
