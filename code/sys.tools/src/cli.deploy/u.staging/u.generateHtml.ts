import { Fs, Path, Pkg, Str, type t } from '../common.ts';
import { TEMPLATE } from './u.generateHtml.tmpl.ts';
import { ensureBuildResetMeta, withBuildResetMeta } from './u.buildReset.ts';

const MARKER = '@sys/tools: index';
const MARKER_TOKEN = `<!-- ${MARKER} -->`;

type TDir = {
  readonly abs: t.StringDir;
  readonly rel: t.StringDir;
  readonly dist?: t.DistPkg;
  readonly hasIndex: boolean;
  readonly hasDistJson: boolean;
};

/**
 * Ensure an `index.html` exists, with scan-root links relative to its destination.
 */
export async function ensureIndexHtml(
  cwd: t.StringDir,
  options: {
    /** Destination directory for the generated index; defaults to the scan root. */
    targetDir?: t.StringDir;
    force?: boolean;
    buildResetToken?: string;
  } = {},
): Promise<void> {
  const raw = String(cwd ?? '').trim();
  if (!raw) return;

  const root = Fs.Path.resolve(raw);
  const targetRoot = Fs.Path.resolve(options.targetDir ?? root);
  const target = Fs.join(targetRoot, 'index.html');
  const exists = await Fs.exists(target);
  if (exists) {
    const ok = await shouldOverwrite(target, options.force === true);
    if (!ok) {
      await ensureBuildResetMeta(target, options.buildResetToken);
      return;
    }
  }
  const dirs = await directories(root);
  const html = renderHtml(dirs, targetRoot, options.buildResetToken);
  await Fs.ensureDir(targetRoot);
  await Fs.write(target, html);
}

/**
 * Helpers:
 */
async function directories(root: t.StringDir) {
  const glob = Fs.glob(Fs.Path.resolve(root), { includeDirs: true, depth: 1 });
  const entries = await glob.find('*');

  const res: TDir[] = [];
  for (const entry of entries.filter((entry) => entry.isDirectory)) {
    const abs = entry.path;
    const rel = Str.trimSlashes(abs.startsWith(root) ? abs.slice(root.length) : abs);
    const dist = (await Pkg.Dist.load(abs)).dist;
    const hasIndex = await Fs.exists(Fs.join(abs, 'index.html'));
    const hasDistJson = await Fs.exists(Fs.join(abs, 'dist.json'));
    res.push({ abs, rel, dist, hasIndex, hasDistJson });
  }

  const compare = Str.Compare.natural();
  return res.toSorted((a, b) => compareDirName(compare, a.rel, b.rel));
}

function renderHtml(dirs: TDir[], targetRoot: t.StringDir, buildResetToken?: string): string {
  const indent = ' '.repeat(8);
  const items = dirs
    .map((dir) => {
      const href = relativeHref(targetRoot, dir.abs);
      const target = dir.hasIndex ? `${href}/` : dir.hasDistJson ? `${href}/dist.json` : `${href}/`;
      const trimmed = Str.trimLeadingDotSlash(dir.rel);
      let label = trimmed;
      if (dir.dist) {
        const hash = dir.dist.hash.digest;
        label = `<span class="version" title="${hash}">#${hash.slice(-5)}</span> ${label}`;
      }
      return `${indent}<li><a href="${target}">${label}</a></li>`;
    })
    .join('\n');

  const list = items ? `${items}\n${indent}<hr />\n` : '';
  const html = TEMPLATE.replace('__LIST__\n', list);
  return buildResetToken ? withBuildResetMeta(html, buildResetToken) : html;
}

function relativeHref(from: t.StringDir, to: t.StringDir): string {
  const relative = Path.relative(from, to).replaceAll('\\', '/');
  return relative.startsWith('.') ? relative : `./${relative}`;
}

function compareDirName(compare: (a: string, b: string) => number, a: string, b: string): number {
  return compare(Str.trimLeadingDotSlash(a), Str.trimLeadingDotSlash(b));
}

const shouldOverwrite = async (target: string, force: boolean): Promise<boolean> => {
  if (!force) return false;
  const res = await Fs.readText(target);
  if (!res.exists || !res.data) return true;
  return res.data.includes(MARKER_TOKEN);
};
