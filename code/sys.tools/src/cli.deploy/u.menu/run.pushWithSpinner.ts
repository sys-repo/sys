import { type t, c, Cli, Path, Pkg, Str, Time } from '../common.ts';
import { Fmt } from '../u.fmt.ts';
import { pushProvider } from '../u.push/u.push.ts';

type RunPushResult =
  | { readonly ok: true; readonly elapsed?: string }
  | { readonly ok: false; readonly error?: unknown; readonly hint?: string };

/**
 * Run pushProvider with a stable spinner UI.
 * Never throws.
 */
export async function runPushWithSpinner(args: {
  cwd: t.StringDir;
  provider: t.DeployTool.Config.Provider.All;
  stagingDir: t.StringDir;
}): Promise<RunPushResult> {
  const spin = Cli.spinner();
  const dist = (await Pkg.Dist.load(Path.join(args.stagingDir, '.'))).dist;
  const bytes = dist?.build.size.total ?? 0;

  let pushing = `Pushing to ${c.white(args.provider.kind)}`;
  if (bytes) pushing += ` (${Str.bytes(bytes)})`;

  const started = Time.now.timestamp;
  spin.start(Fmt.spinnerText(pushing));

  try {
    const res = await pushProvider(args);

    if (res.ok) {
      const elapsed = Time.elapsed(started).toString();
      spin.succeed(Fmt.spinnerText(c.green(`push complete (elapsed ${elapsed})`)));
      return { ok: true, elapsed };
    }

    spin.fail(Fmt.spinnerText('push failed'));
    return { ok: false, error: res.error, hint: res.hint };
  } catch (error) {
    spin.fail(Fmt.spinnerText('push failed'));
    return { ok: false, error };
  }
}
