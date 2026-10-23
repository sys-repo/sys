import { describe, expect, it, type t } from '../../-test.ts';
import { refreshCache } from '../u.refreshCache.ts';

describe('cli.upgrade.refreshCache', () => {
  it('refreshes the public JSR cache without workspace config or lockfiles', async () => {
    const calls: t.Process.InvokeArgs[] = [];

    const res = await refreshCache(
      '/workspace/sys' as t.StringDir,
      {},
      {
        invoke: async (args) => {
          calls.push(args);
          return output({ success: true });
        },
      },
    );

    expect(res.success).to.eql(true);
    expect(calls).to.eql([
      {
        cmd: 'deno',
        args: ['cache', '--reload', '--no-config', '--no-lock', 'jsr:@sys/tools'],
        cwd: '/workspace/sys',
        silent: false,
      },
    ]);
  });
});

function output(args: { success: boolean; stdout?: string; stderr?: string }): t.Process.Output {
  return {
    code: args.success ? 0 : 1,
    success: args.success,
    signal: null,
    stdout: new TextEncoder().encode(args.stdout ?? ''),
    stderr: new TextEncoder().encode(args.stderr ?? ''),
    text: { stdout: args.stdout ?? '', stderr: args.stderr ?? '' },
    toString() {
      return [args.stdout, args.stderr].filter(Boolean).join('\n');
    },
  };
}
