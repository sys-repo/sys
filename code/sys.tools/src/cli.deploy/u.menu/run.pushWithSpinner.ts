import { type t, c, Cli, Is, Path, Pkg, Str, Time } from '../common.ts';
import { Fmt } from '../u.fmt.ts';
import { pushProvider } from '../u.push/u.push.ts';

type RunPushResult =
  | {
      readonly ok: true;
      readonly elapsed?: string;
      readonly shards?: number;
      readonly bytes?: number;
    }
  | { readonly ok: false; readonly error?: unknown; readonly hint?: string };

/**
 * Run pushProvider with a stable spinner UI.
 * Never throws.
 */
export async function runPushWithSpinner(args: {
  cwd: t.StringDir;
  target: t.PushTarget;
}): Promise<RunPushResult> {
  const spin = Cli.spinner();
  const dist = args.target.stagingDir
    ? (await Pkg.Dist.load(Path.join(args.target.stagingDir, '.'))).dist
    : undefined;
  const bytes = dist?.build.size.total ?? 0;

  const shardLabel = Is.num(args.target.shard) ? 'shard' : undefined;
  const providerDomain =
    args.target.provider.kind === 'orbiter' ? String(args.target.provider.domain ?? '').trim() : '';
  const providerLabel =
    String(args.target.domain ?? '').trim() || providerDomain || args.target.provider.kind;
  let pushing = shardLabel
    ? `pushing ${shardLabel} to ${c.white(providerLabel)}`
    : `pushing to ${c.white(providerLabel)}`;
  if (bytes) pushing += ` (${Str.bytes(bytes)})`;

  const started = Time.now.timestamp;
  spin.start(Fmt.spinnerText(pushing));

  try {
    const res = await pushProvider(args);

    if (res.ok) {
      const elapsed = Time.elapsed(started).toString();
      const summary = `elapsed ${elapsed}${bytes ? `, ${Str.bytes(bytes)}` : ''}`;
      const url = providerLabel ? `https://${providerLabel}` : '';
      const status = [c.green('push complete'), c.gray(`(${summary})`), url ? c.white(url) : '']
        .filter(Boolean)
        .join(' ');
      spin.succeed(Fmt.spinnerText(status));
      return { ok: true, elapsed, bytes };
    }

    spin.fail(Fmt.spinnerText('push failed'));
    return { ok: false, error: res.error, hint: res.hint };
  } catch (error) {
    spin.fail(Fmt.spinnerText('push failed'));
    return { ok: false, error };
  }
}
