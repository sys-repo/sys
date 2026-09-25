import { c, Cli, Path, Pkg, Str, type t, Time } from '../common.ts';
import { Fmt } from '../u.fmt.ts';
import { pushTarget } from '../u.push/u.push.ts';

type RunPushResult =
  | {
    readonly ok: true;
    readonly elapsed?: string;
    readonly bytes?: number;
    readonly publish?: t.PushPublishStats;
    readonly prune?: t.PushPruneStats;
  }
  | { readonly ok: false; readonly error?: unknown; readonly hint?: string };

type SpinnerFactory = () => t.Cli.Spinner.Instance;
type PushTarget = typeof pushTarget;

type RunPushDeps = {
  /** Test-only spinner construction seam. */
  spinner?: SpinnerFactory;
  /** Test-only resolved-target execution seam. */
  push?: PushTarget;
};

/**
 * Publish one resolved target with stable spinner output.
 * Returns a failure result instead of throwing.
 */
export async function runPushWithSpinner(
  args: {
    cwd: t.StringDir;
    target: t.PushTarget;
    force?: boolean;
  },
  options: RunPushDeps = {},
): Promise<RunPushResult> {
  let spin: t.Cli.Spinner.Instance | undefined;

  try {
    spin = (options.spinner ?? Cli.spinner)();
    const dist = args.target.stagingDir
      ? (await Pkg.Dist.load(Path.join(args.target.stagingDir, '.'))).dist
      : undefined;
    const bytes = dist?.build.size.total ?? 0;
    const provider = displayProvider(args.target);
    let pushing = `pushing to ${c.white(provider.label)}`;
    if (args.force) pushing += ` ${c.yellow('(force)')}`;
    if (bytes) pushing += ` (staged ${Str.bytes(bytes)})`;

    const started = Time.now.timestamp;
    spin.start(Fmt.spinnerText(pushing));
    const res = await (options.push ?? pushTarget)(args);

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
      succeedSpinner(spin, status);
      return { ok: true, elapsed, bytes, publish: res.publish, prune: res.prune };
    }

    failSpinner(spin);
    return { ok: false, error: res.error, hint: res.hint };
  } catch (error) {
    failSpinner(spin);
    return { ok: false, error };
  }
}

function succeedSpinner(spin: ReturnType<typeof Cli.spinner>, status: string): void {
  try {
    spin.succeed(Fmt.spinnerText(status));
  } catch {
    // Presentation failure must not falsify a successful provider result.
  }
}

function failSpinner(spin: ReturnType<typeof Cli.spinner> | undefined): void {
  try {
    spin?.fail(Fmt.spinnerText('push failed'));
  } catch {
    // Presentation failure must not escape the result boundary.
  }
}

function displayProvider(target: t.PushTarget): { readonly label: string; readonly url?: string } {
  const provider = target.provider;
  const readOrigin = String(target.domain ?? provider.readOrigin ?? '').trim();
  if (readOrigin) return { label: readOrigin, url: asUrl(readOrigin) };

  const bucket = String(provider.bucket ?? '').trim();
  const prefix = String(provider.prefix ?? '').trim();
  const label = ['r2', bucket ? `bucket:${bucket}` : '', prefix ? `prefix:${prefix}` : '']
    .filter(Boolean)
    .join(' ');
  return { label };
}

function asUrl(input: string): string {
  return input.startsWith('http') ? input : `https://${input}`;
}
