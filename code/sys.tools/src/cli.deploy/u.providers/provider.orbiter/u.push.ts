import { type t, Cli } from '../../common.ts';
import { OrbiterCli } from './u.orbiter-cli.ts';

export async function push(args: {
  cwd: t.StringDir;
  stagingDir: t.StringDir;
  provider: t.DeployTool.Config.Provider.Orbiter;
}): Promise<t.PushResult> {
  try {
    const buildDir = args.stagingDir;
    const siteId = String(args.provider.siteId ?? '');
    const domain = String(args.provider.domain ?? '');

    if (!siteId) return { ok: false, reason: 'failed', hint: 'Missing provider.siteId' };
    if (!domain) return { ok: false, reason: 'failed', hint: 'Missing provider.domain' };
    if (!buildDir) return { ok: false, reason: 'failed', hint: 'Missing buildDir' };

    const tokenFile = getOrbiterTokenFile();
    const localConfig = getOrbiterLocalConfigFile(buildDir);
    const argv = [
      'deploy',
      '--siteId',
      siteId,
      '--buildCommand',
      'echo "no-op"',
      '--buildDir',
      '.',
    ];
    const out = await OrbiterCli.run(buildDir, argv, {
      allowRead: tokenFile ? [tokenFile] : [],
      allowWrite: [tokenFile, localConfig].filter((value): value is string => Boolean(value)),
      allowRun: ['/bin/sh'],
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
function getOrbiterTokenFile(): string | undefined {
  try {
    const home = Deno.env.get('HOME')?.trim();
    if (!home) return undefined;
    return `${home}/.orbiter.json`;
  } catch {
    return undefined;
  }
}

function getOrbiterLocalConfigFile(buildDir: string): string | undefined {
  const dir = buildDir.trim();
  if (!dir) return undefined;
  return `${dir}/orbiter.json`;
}

function containsError(stderr = ''): boolean {
  const log = Cli.stripAnsi(stderr);
  if (!log) return false;

  return (
    /Problem updating site:/i.test(log) ||
    /\bServer error\b/i.test(log) ||
    /No site found with ID:/i.test(log) ||
    /Deployment failed/i.test(log) ||
    /Command failed/i.test(log) ||
    /Error:/i.test(log)
  );
}
