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
      'x',
      ['npm:orbiter-cli', 'deploy'],
      ['--siteId', siteId],
      ['--buildCommand', 'echo no-op'],
      ['--buildDir', buildDir],
    ];

    const out = await Process.invoke({
      cmd: 'deno',
      args: argv.flatMap((x) => (Array.isArray(x) ? x : [x])),
      cwd,
      silent: true,
    });

    if (!out.success || containsError(out.text.stderr)) {
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

/**
 * Helpers:
 */
function containsError(stderr = ''): boolean {
  if (!stderr) return false;
  return (
    /Problem updating site:/i.test(stderr) ||
    /\bServer error\b/i.test(stderr) ||
    /No site found with ID:/i.test(stderr) ||
    /\bError:\s*Error:\b/i.test(stderr)
  );
}
