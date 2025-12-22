import { type t, Str, c, Cli, Pkg, Path } from '../common.ts';
import { Fmt } from '../u.fmt.ts';
import { pushProvider } from '../u.push/u.push.ts';

type RunPushResult =
  | { readonly ok: true }
  | { readonly ok: false; readonly error?: unknown; readonly hint?: string };

/**
 * Run pushProvider with a stable spinner UI.
 * Never throws.
 */
export async function runPushWithSpinner(args: {
  readonly provider: t.DeployTool.Config.Provider.All;
  readonly stagingDir: t.StringDir;
  readonly buildDir: t.StringPath;
}): Promise<RunPushResult> {
  const spin = Cli.spinner();

  // console.log('args', args);

  const dist = (await Pkg.Dist.load(Path.join(args.stagingDir, args.buildDir))).dist;
  const bytes = dist?.build.size.total ?? 0;
  // const size = x

  let pushing = `Pushing to ${c.white(args.provider.kind)}`;
  if (bytes) pushing += ` (${Str.bytes(bytes)})`;

  spin.start(Fmt.spinnerText(pushing));

  try {
    const res = await pushProvider(args);

    if (res.ok) {
      spin.succeed(Fmt.spinnerText(c.green('push complete')));
      return { ok: true };
    }

    spin.fail(Fmt.spinnerText('push failed'));
    return { ok: false, error: res.error, hint: res.hint };
  } catch (error) {
    spin.fail(Fmt.spinnerText('push failed'));
    return { ok: false, error };
  }
}
