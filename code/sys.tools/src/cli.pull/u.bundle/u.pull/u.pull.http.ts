import { type t, c, Cli, Err, Http, Str, Url } from '../../common.ts';
import { Fmt as BaseFmt } from '../../u.fmt.ts';
import { createMonotonicProgress } from '../u.monotonicProgress.ts';
import { rewriteTags } from '../u.pull.rewriteTags.ts';
import { clearTargetDir, done, errorMessage, fail } from './common.ts';

type Progress = { index: t.Index; total: number };

const Fmt = {
  ...BaseFmt,
  bundleSize(dist: t.DistPkg) {
    return Str.bytes(dist.build.size.total);
  },

  pullingSpinnerText(opts: { dist?: t.DistPkg; progress?: Progress } = {}) {
    const { dist, progress } = opts;
    const a: string[] = [];

    if (dist) a.push(Fmt.bundleSize(dist));

    if (progress) {
      const curr = progress.index + 1;
      const done = curr >= progress.total;
      const indexText = done ? c.green(String(curr)) : c.white(String(curr));
      a.push(`${indexText}/${progress.total} files`);
    }

    const after = a.length === 0 ? '' : `(${a.join(' · ')})`;
    return Fmt.spinnerText(`pulling remote bundle... ${after}`.trim());
  },
} as const;

export async function pullHttpBundle(
  baseDir: t.StringDir,
  bundle: t.PullTool.ConfigYaml.HttpBundle,
): Promise<t.PullToolRemoteBundleResult> {
  const spinner = Cli.spinner();
  const targetDir = `${baseDir}/${bundle.local.dir}`;
  const distUrl = Url.toCanonical(bundle.dist);
  if (!distUrl.ok) return fail(`Invalid dist.json URL: ${distUrl.href}`);

  // Pull `dist.json` manifest:
  spinner.start(Fmt.pullingSpinnerText());
  const dist = await pullDist(distUrl.href);

  const updateSpinnerText = (progress?: Progress) => Fmt.pullingSpinnerText({ dist, progress });
  const updateSpinner = (progress?: Progress) => (spinner.text = updateSpinnerText(progress));
  updateSpinner();

  if (bundle.local.clear === true) {
    spinner.text = Fmt.spinnerText('clearing local target...');
    await clearTargetDir({ baseDir, targetDir });
    updateSpinner();
  }

  const toMonotonic = createMonotonicProgress();
  const onStream = (e: t.HttpPullEvent) => {
    // Stream events may regress (retries / mixed event kinds).
    // Clamp display to a monotonic incrementing view.
    const next = toMonotonic(e.index, e.total);
    updateSpinner({ index: next.shownIndex as t.Index, total: next.total });
  };

  // Pull folder from manifest:
  try {
    const result = await pullDir(distUrl.href, targetDir, { dist, onStream });
    await rewriteTags(baseDir, bundle);

    if (!result.ok) {
      const error = summarizePullFailure(result);
      spinner.fail(Fmt.spinnerText(error));
      return fail(error);
    } else {
      const size = c.dim(`(${Fmt.bundleSize(dist)})`);
      const fullpath = Fmt.prettyPath(targetDir);
      const path = `./${c.cyan(bundle.local.dir)} ${size}\n  ${fullpath}`;
      const msg = c.gray(`${c.green('bundle pulled')} → ${path}`);
      spinner.succeed(Fmt.spinnerText(msg));
    }

    return done({
      ...result,
      dist,
      summary: { kind: 'http', source: distUrl.href },
      get ops() {
        return result.ops;
      },
    });
  } catch (error) {
    spinner.fail(Fmt.spinnerText('bundle pull error'));
    return fail(errorMessage(error));
  } finally {
    spinner.stop();
  }
}

async function pullDist(distUrl: t.StringUrl): Promise<t.DistPkg> {
  const client = Http.client();
  const r = await client.json<t.DistPkg>(distUrl);
  if (!r.ok) throw Err.std('dist.json fetch failed', { cause: r.error });
  return r.data!;
}

/**
 * Pull all files listed in the dist manifest into `targetDir`.
 * The directory containing `dist.json` is treated as the remote bundle root.
 */
async function pullDir(
  distUrl: t.StringUrl,
  targetDir: t.StringDir,
  opts: { dist?: t.DistPkg; onStream?: (e: t.HttpPullEvent) => void } = {},
) {
  const dist = opts.dist ?? (await pullDist(distUrl));
  const distUrlObj = new URL(distUrl);

  /**
   * Remote bundle root (the directory that contains dist.json).
   * Examples:
   *    '/app/bundles/driver' → '.../app/bundles/driver/dist.json'
   *    '/'                   → '.../dist.json' at host root
   */
  const bundleRootPath = Str.stripTrailingPathSegment(distUrlObj.pathname);
  const relativeTo = bundleRootPath === '' ? '/' : bundleRootPath;

  // Base URL for resolving manifest paths (index.html, pkg/*, sw.js, etc).
  const baseUrl = new URL('.', distUrlObj);

  // Manifest paths → absolute URLs.
  const assetUrls = Object.keys(dist.hash.parts).map((p) => new URL(p, baseUrl).href);

  // Include dist.json itself so it's cached alongside the assets.
  const urls = [distUrlObj.href, ...assetUrls];

  const stream = Http.Pull.stream(urls, targetDir, {
    retry: { attempts: 8, base: 200, factor: 2, jitter: true },
    map: {
      /**
       * Strip the bundle root from the URL pathname so files land
       * relative to `targetDir`, matching the manifest paths.
       *
       * Example:
       *   pathname: '/app/bundles/driver/index.html'
       *   relativeTo: '/app/bundles/driver'
       *   → 'index.html'
       */
      relativeTo,
    },
  });

  for await (const ev of stream) {
    opts.onStream?.(ev);
  }

  return stream.done;
}

/**
 * Summarise a failed pull into a single CLI-friendly message.
 */
function summarizePullFailure(result: t.HttpPullToDirResult): string {
  const failed = result.ops.filter((op) => !op.ok);
  const total = result.ops.length;

  if (!failed.length) return 'bundle pull failed';

  const first = failed[0];
  const parts: string[] = [];

  parts.push(
    failed.length === 1
      ? `bundle pull failed (1/${total} files)`
      : `bundle pull failed (${failed.length}/${total} files)`,
  );

  parts.push(`source: ${first.path.source}`);

  if (first.status) parts.push(`status ${first.status}`);
  if (first.error) parts.push(first.error);

  return parts.join('\n - ');
}
