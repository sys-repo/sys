import { type t, Fs, Pkg, Str } from '../common.ts';
import { TEMPLATE } from './u.generateHtml.tmpl.ts';

type TDir = {
  readonly abs: t.StringDir;
  readonly rel: t.StringDir;
  readonly dist?: t.DistPkg;
  readonly hasIndex: boolean;
  readonly hasDistJson: boolean;
};

/**
 * Ensure an `index.html` exists inside a staging root.
 */
export async function ensureIndexHtml(
  cwd: t.StringDir,
  options: { readonly force?: boolean; readonly baseDomain?: string } = {},
): Promise<void> {
  const raw = String(cwd ?? '').trim();
  if (!raw) return;

  const root = Fs.Path.resolve(raw);
  const target = Fs.join(root, 'index.html');
  const exists = await Fs.exists(target);
  if (exists) {
    const ok = await shouldOverwrite(target, options.force === true);
    if (!ok) return;
  }
  if (!exists && !options.force) {
    // no-op: only create when missing unless force is requested
  }

  const dirs = await directories(root);
  const html = renderHtml(dirs, options.baseDomain);
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
    if (rel === '-root') continue;
    const dist = (await Pkg.Dist.load(abs)).dist;
    const hasIndex = await Fs.exists(Fs.join(abs, 'index.html'));
    const hasDistJson = await Fs.exists(Fs.join(abs, 'dist.json'));
    res.push({ abs, rel, dist, hasIndex, hasDistJson });
  }

  return res;
}

function renderHtml(dirs: TDir[], baseDomain?: string): string {
  const indent = ' '.repeat(8);
  const domain = String(baseDomain ?? '').trim();

  const items = dirs
    .map((dir) => {
      const trimmed = Str.trimLeadingDotSlash(dir.rel);
      const shardIndex = parseShardIndex(trimmed);
      const absolute =
        shardIndex !== undefined && domain ? `https://${shardIndex}.${domain}/` : undefined;
      const href =
        absolute ??
        (dir.hasIndex
          ? `./${trimmed}/`
          : dir.hasDistJson
            ? `./${trimmed}/dist.json`
            : `./${trimmed}/`);
      let label = trimmed;
      if (dir.dist) {
        const hash = dir.dist.hash.digest;
        label = `<span class="version" title="${hash}">#${hash.slice(-5)}</span> ${label}`;
      }
      return `${indent}<li><a href="${href}">${label}</a></li>`;
    })
    .join('\n');

  const list = items ? `${items}\n${indent}<hr />\n` : '';
  return TEMPLATE.replace('__LIST__\n', list);
}

function parseShardIndex(input: string): number | undefined {
  const m = /^shard\.(\d+)$/.exec(input);
  if (!m) return undefined;
  const value = Number.parseInt(m[1]!, 10);
  return Number.isFinite(value) ? value : undefined;
}

const MARKER = '@sys/tools: index';
const MARKER_TOKEN = `<!-- ${MARKER} -->`;

const shouldOverwrite = async (target: string, force: boolean): Promise<boolean> => {
  if (!force) return false;
  const res = await Fs.readText(target);
  if (!res.exists || !res.data) return true;
  return res.data.includes(MARKER_TOKEN);
};
