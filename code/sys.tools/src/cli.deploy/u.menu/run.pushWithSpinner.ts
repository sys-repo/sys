import { c, Cli, Is, Path, Pkg, Str, type t, Time } from '../common.ts';
import { Fmt } from '../u.fmt.ts';
import { pushProvider } from '../u.push/u.push.ts';

type RunPushResult =
  | {
    readonly ok: true;
    readonly elapsed?: string;
    readonly shards?: number;
    readonly bytes?: number;
    readonly publish?: t.PushPublishStats;
  }
  | { readonly ok: false; readonly error?: unknown; readonly hint?: string };

/**
 * Run pushProvider with a stable spinner UI.
 * Never throws.
 */
export async function runPushWithSpinner(args: {
  cwd: t.StringDir;
  target: t.PushTarget;
  force?: boolean;
}): Promise<RunPushResult> {
  const spin = Cli.spinner();
  const dist = args.target.stagingDir
    ? (await Pkg.Dist.load(Path.join(args.target.stagingDir, '.'))).dist
    : undefined;
  const bytes = dist?.build.size.total ?? 0;

  const shardLabel = Is.num(args.target.shard) ? 'shard' : undefined;
  const provider = displayProvider(args.target);
  let pushing = shardLabel
    ? `pushing ${shardLabel} to ${c.white(provider.label)}`
    : `pushing to ${c.white(provider.label)}`;
  if (args.force) pushing += ` ${c.yellow('(force)')}`;
  if (bytes) pushing += ` (staged ${Str.bytes(bytes)})`;

  const started = Time.now.timestamp;
  spin.start(Fmt.spinnerText(pushing));

  try {
    const res = await pushProvider(args);

    if (res.ok) {
      const elapsed = Time.elapsed(started).toString();
      const summary = `elapsed ${elapsed}${bytes ? `, staged ${Str.bytes(bytes)}` : ''}`;
      const status = [
        c.green('push complete'),
        c.gray(`(${summary})`),
        provider.url ? c.white(provider.url) : '',
      ]
        .filter(Boolean)
        .join(' ');
      spin.succeed(Fmt.spinnerText(status));
      return { ok: true, elapsed, bytes, publish: res.publish };
    }

    spin.fail(Fmt.spinnerText('push failed'));
    return { ok: false, error: res.error, hint: res.hint };
  } catch (error) {
    spin.fail(Fmt.spinnerText('push failed'));
    return { ok: false, error };
  }
}

function displayProvider(target: t.PushTarget): { readonly label: string; readonly url?: string } {
  const targetDomain = String(target.domain ?? '').trim();
  const provider = target.provider;

  if (provider.kind === 'r2') {
    const readOrigin = targetDomain || String(provider.readOrigin ?? '').trim();
    if (readOrigin) return { label: readOrigin, url: asUrl(readOrigin) };

    const bucket = String(provider.bucket ?? '').trim();
    const prefix = String(provider.prefix ?? '').trim();
    const label = [`r2`, bucket ? `bucket:${bucket}` : '', prefix ? `prefix:${prefix}` : '']
      .filter(Boolean)
      .join(' ');
    return { label };
  }

  if (provider.kind === 'orbiter') {
    const domain = targetDomain || String(provider.domain ?? '').trim();
    if (domain) return { label: domain, url: asUrl(domain) };
  }

  return { label: String(provider.kind) };
}

function asUrl(input: string): string {
  return input.startsWith('http') ? input : `https://${input}`;
}
