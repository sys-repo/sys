import { type t, c, Cli, Fs, Str } from '../../common.ts';
import {
  downloadGithubAsset,
  downloadGithubAssetById,
  listGithubReleases,
  loadGithubToken,
} from '../../u.github/u.client.ts';
import { resolveGithubReleaseBundle } from '../../u.github/u.release.resolve.ts';
import { Fmt } from '../../u.fmt.ts';
import { done, errorMessage, fail, githubTokenHelpText, mapAuthError } from './common.ts';

export async function pullGithubReleaseBundle(
  baseDir: t.StringDir,
  bundle: t.PullTool.ConfigYaml.GithubReleaseBundle,
): Promise<t.PullToolRemoteBundleResult> {
  const spinner = Cli.spinner();
  const token = await loadGithubToken();

  try {
    if (!token) {
      return fail(
        [
          'GitHub token not found.',
          'Set GH_TOKEN (or GITHUB_TOKEN) to pull github:release bundles.',
          githubTokenHelpText(),
        ].join('\n'),
      );
    }

    spinner.start(Fmt.spinnerText('resolving github release...'));

    const releases = await listGithubReleases({ repo: bundle.repo, token });
    const resolved = resolveGithubReleaseBundle(bundle, releases);
    if (!resolved.ok) return fail(resolved.error);

    const release = resolved.data.release;
    const assets = resolved.data.assets;
    const releaseTagDir = toSafeTagDir(release.tag);
    const targetRoot = Fs.join(baseDir, bundle.local.dir, releaseTagDir) as t.StringDir;
    await Fs.ensureDir(targetRoot);

    const targetNames = resolveTargetNames(assets);
    const ops: Array<t.PullToolBundleResult['ops'][number]> = [];

    for (const [index, asset] of assets.entries()) {
      const source = asset.downloadUrl;
      const target = Fs.join(targetRoot, targetNames[index]);
      const total = assets.length;
      const progress = total > 1 ? ` ${index + 1}/${total}` : '';

      try {
        spinner.text = Fmt.spinnerText(`downloading${progress} ${c.cyan(asset.name)}...`);
        const bytes = await downloadGithubAssetWithFallback({
          repo: bundle.repo,
          assetId: asset.id,
          url: source,
          token,
        });

        await Fs.ensureDir(Fs.dirname(target));
        await Fs.write(target, bytes, { force: true });

        ops.push({
          ok: true,
          path: { source, target },
          bytes: bytes.byteLength,
        });
      } catch (error) {
        ops.push({
          ok: false,
          path: { source, target },
          error: errorMessage(error),
        });
      }
    }

    const failed = ops.filter((m) => !m.ok);
    if (failed.length > 0) {
      return fail(summarizeGithubPullFailures(failed, ops.length));
    }

    spinner.succeed(
      c.gray(
        `${c.green('release pulled')} → ${c.cyan(`${bundle.local.dir}/${releaseTagDir}`)} (${ops.length} assets)`,
      ),
    );
    console.info(formatGithubReleaseSummary({ bundle, release, ops }));

    return done({
      ok: true,
      ops,
    });
  } catch (error) {
    const auth = mapAuthError(error);
    return fail(auth ?? errorMessage(error));
  } finally {
    spinner.stop();
  }
}

async function downloadGithubAssetWithFallback(args: {
  repo: string;
  assetId: number;
  url: t.StringUrl;
  token: string;
}): Promise<Uint8Array> {
  try {
    return await downloadGithubAssetById({
      repo: args.repo,
      assetId: args.assetId,
      token: args.token,
    });
  } catch {
    return await downloadGithubAsset({
      url: args.url,
      token: args.token,
    });
  }
}

function resolveTargetNames(assets: readonly t.PullTool.GithubReleaseAsset[]): string[] {
  const counts = new Map<string, number>();
  return assets.map((asset, index) => {
    const name = toSafeAssetFilename(asset.name, index);
    const next = (counts.get(name) ?? 0) + 1;
    counts.set(name, next);
    return next === 1 ? name : appendFileSuffix(name, `-${next}`);
  });
}

function appendFileSuffix(filename: string, suffix: string): string {
  const i = filename.lastIndexOf('.');
  if (i <= 0) return `${filename}${suffix}`;
  return `${filename.slice(0, i)}${suffix}${filename.slice(i)}`;
}

function toSafeTagDir(value: string): string {
  const raw = String(value ?? '').trim();
  const safe = raw
    .replaceAll('/', '-')
    .replaceAll('\\', '-')
    .replace(/[^A-Za-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return safe || 'release';
}

function toSafeAssetFilename(value: string, index: number): string {
  const raw = String(value ?? '').trim();
  const safe = raw
    .replaceAll('/', '-')
    .replaceAll('\\', '-')
    .replace(/[\u0000-\u001f]+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return safe || `asset-${index + 1}`;
}

function summarizeGithubPullFailures(
  failed: readonly t.PullToolBundleResult['ops'][number][],
  total: number,
): string {
  const first = failed[0];
  if (!first) return 'release pull failed';

  const parts: string[] = [];
  parts.push(
    failed.length === 1
      ? `release pull failed (1/${total} assets)`
      : `release pull failed (${failed.length}/${total} assets)`,
  );
  parts.push(`source: ${first.path.source}`);
  if (first.error) parts.push(first.error);
  return parts.join('\n - ');
}

function formatGithubReleaseSummary(args: {
  bundle: t.PullTool.ConfigYaml.GithubReleaseBundle;
  release: t.PullTool.GithubRelease;
  ops: readonly t.PullToolBundleResult['ops'][number][];
}): string {
  const { bundle, release, ops } = args;
  const table = Cli.table();
  const outputs = ops.filter((m) => m.ok);
  const bytes = outputs.reduce((acc, m) => acc + Number(m.bytes ?? 0), 0);
  const outputRows = outputs.map((m) => {
    const path = Fs.trimCwd(m.path.target);
    const size = Number(m.bytes ?? 0);
    return { path, size };
  });
  const maxPathLen = outputRows.reduce((acc, m) => Math.max(acc, m.path.length), 0);
  const outputLines = outputRows.map((m, index, all) => {
    const branch = Fmt.Tree.branch([index, all]);
    const parts = splitDirAndFile(m.path);
    const pad = ' '.repeat(Math.max(1, maxPathLen - m.path.length + 1));
    const sizeLabel = c.dim(c.gray(`| ${Str.bytes(m.size)}`));
    const file = parts.file ? c.cyan(parts.file) : c.cyan(m.path);
    return `${c.dim(branch)} ${c.gray(parts.dir)}${file}${pad}${sizeLabel}`;
  });

  table.body([
    [c.gray(' release'), c.white(release.tag)],
    [c.gray(' repo'), c.cyan(bundle.repo)],
    [c.gray(' assets'), c.white(String(outputs.length))],
    [c.gray(' bytes'), c.gray(Str.bytes(bytes))],
    [
      c.gray(' output'),
      outputLines.length > 0 ? outputLines.join('\n') : c.gray(c.dim('(none)')),
    ],
  ]);

  return String(
    Str.builder()
      .blank()
      .line(Str.trimEdgeNewlines(String(table))),
  );
}

function splitDirAndFile(path: string): { dir: string; file: string } {
  const a = path.lastIndexOf('/');
  const b = path.lastIndexOf('\\');
  const i = Math.max(a, b);
  if (i < 0) return { dir: '', file: path };
  return {
    dir: path.slice(0, i + 1),
    file: path.slice(i + 1),
  };
}
