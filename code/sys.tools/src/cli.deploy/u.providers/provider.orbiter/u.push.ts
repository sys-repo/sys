import { type t, Process } from '../../common.ts';

export async function push(args: {
  cwd: t.StringDir;
  stagingDir: t.StringRelativeDir;
  provider: t.DeployTool.Config.Provider.Orbiter;
}): Promise<t.PushResult> {
  try {
    const { cwd } = args;
    const buildDir = args.stagingDir;
    const siteId = String(args.provider.siteId ?? '');
    const domain = String(args.provider.domain ?? '');

    if (!siteId) return { ok: false, reason: 'failed', hint: 'Missing provider.siteId' };
    if (!domain) return { ok: false, reason: 'failed', hint: 'Missing provider.domain' };
    if (!buildDir) return { ok: false, reason: 'failed', hint: 'Missing buildDir' };

    const argv = [
      'deploy',
      ['--siteId', siteId],
      ['--domain', domain],
      ['--buildCommand', 'echo no-op'],
      ['--buildDir', buildDir],
    ];

    const out = await Process.invoke({
      cmd: 'orbiter',
      args: argv.flatMap((x) => (Array.isArray(x) ? x : [x])),
      cwd,
      silent: true,
    });

    if (!out.success) {
      const code = String(out.code ?? '');
      const stderr = String(out.text?.stderr ?? '').trim();
      const hint = stderr
        ? `orbiter deploy failed (exit ${code}): ${stderr}`
        : `orbiter deploy failed (exit ${code})`;

      return { ok: false, reason: 'failed', hint, error: out };
    }

    return { ok: true };
  } catch (error) {
    return { ok: false, reason: 'failed', hint: 'orbiter deploy failed', error };
  }
}
