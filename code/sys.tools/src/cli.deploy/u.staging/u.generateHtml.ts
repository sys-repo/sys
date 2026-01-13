import { type t, Fs, Pkg, Str } from '../common.ts';
import { TEMPLATE } from './u.generateHtml.tmpl.ts';

type TDir = {
  readonly abs: t.StringDir;
  readonly rel: t.StringDir;
  readonly dist?: t.DistPkg;
};

/**
 * Ensure an `index.html` exists inside a staging root.
 */
export async function ensureIndexHtml(cwd: t.StringDir): Promise<void> {
  const raw = String(cwd ?? '').trim();
  if (!raw) return;

  const root = Fs.Path.resolve(raw);
  const target = Fs.join(root, 'index.html');
  if (await Fs.exists(target)) return;

  const dirs = await directories(root);
  const html = renderHtml(dirs);
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
    res.push({ abs, rel, dist });
  }

  return res;
}

function renderHtml(dirs: TDir[]): string {
  const indent = ' '.repeat(8);

  const items = dirs
    .map((dir) => {
      const trimmed = Str.trimLeadingDotSlash(dir.rel);
      const href = `./${trimmed}/`;
      let label = trimmed;
      if (dir.dist) {
        const hx = dir.dist.hash.digest.slice(-5);
        const hash = `<span class="version">#${hx}</span>`;
        label = `${hash} ${label}`;
      }
      return `${indent}<li><a href="${href}">${label}</a></li>`;
    })
    .join('\n');

  const list = items ? `${items}\n${indent}<hr />` : `${indent}<hr />`;
  return TEMPLATE.replace('__LIST__', list);
}
