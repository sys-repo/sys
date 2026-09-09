import { Fs, Is, Path, Pkg, Str, type t } from '../common.ts';
import { TEMPLATE } from './u.generateHtml.tmpl.ts';
import { ensureBuildResetMeta, withBuildResetMeta } from './u.buildReset.ts';

const MARKER = '@sys/tools: index';
const MARKER_TOKEN = `<!-- ${MARKER} -->`;

type TDir = {
  readonly abs: t.StringDir;
  readonly rel: t.StringDir;
  readonly dist?: t.DistPkg;
};

/** Ensure a marker-owned exact-file directory index exists. */
export async function ensureIndexHtml(
  cwd: t.StringDir,
  options: {
    /** Destination directory for the generated index; defaults to the scan root. */
    targetDir?: t.StringDir;
    force?: boolean;
    buildResetToken?: string;
    /** Link the page to its final local manifest. Defaults true. */
    includeDistLink?: boolean;
    /** Generated index destinations omitted from the scan projection. */
    excludeDirs?: t.StringDir[];
  } = {},
): Promise<void> {
  const raw = String(cwd ?? '');
  if (!raw) return;

  const root = Fs.Path.resolve(raw);
  const targetRoot = Fs.Path.resolve(options.targetDir ?? root);
  const target = Fs.join(targetRoot, 'index.html');
  if (await Fs.exists(target)) {
    const overwrite = await shouldOverwrite(target, options.force === true);
    if (!overwrite) {
      await ensureBuildResetMeta(target, options.buildResetToken);
      return;
    }
  }

  const excludedRoots = [targetRoot, ...(options.excludeDirs ?? [])]
    .map((path) => Fs.Path.resolve(path))
    .filter((path) => path !== root);
  const dirs = (await directories(root)).filter((dir) =>
    excludedRoots.every((excluded) =>
      !Path.Is.within(excluded, dir.abs) && !Path.Is.within(dir.abs, excluded)
    )
  );
  const html = renderHtml(
    dirs,
    targetRoot,
    options.buildResetToken,
    options.includeDistLink !== false,
  );
  await Fs.ensureDir(targetRoot);
  await Fs.write(target, html, { throw: true });
}

async function directories(root: t.StringDir): Promise<readonly TDir[]> {
  const base = Path.resolve(root, '.');
  const glob = Fs.glob(base, { includeDirs: true });
  const entries = await glob.find('*');

  const res: TDir[] = [];
  for (const entry of entries.filter((entry) => entry.isDirectory)) {
    const abs = entry.path;
    const relative = Path.relative(base, abs);
    if (Path.Is.absolute(relative) || !Path.Is.within(base, abs)) {
      throw new Error(`Deploy generated index directory escaped its scan root: ${abs}`);
    }
    const rel = Path.relativePosix(relative);
    const dist = (await Pkg.Dist.load(abs)).dist;
    res.push({ abs, rel, dist });
  }

  const compare = Str.Compare.natural();
  return Object.freeze(res.toSorted((a, b) => compareDirName(compare, a.rel, b.rel)));
}

function renderHtml(
  dirs: TDir[],
  targetRoot: t.StringDir,
  buildResetToken: string | undefined,
  includeDistLink: boolean,
): string {
  const indent = ' '.repeat(8);
  const items = dirs
    .map((dir) => {
      const href = escapeHtml(`${relativeHref(targetRoot, dir.abs)}/index.html`);
      const trimmed = Str.trimLeadingDotSlash(dir.rel);
      let label = escapeHtml(trimmed);
      if (dir.dist) {
        const hash = escapeHtml(dir.dist.hash.digest);
        label = `<span class="version" title="${hash}">#${hash.slice(-5)}</span> ${label}`;
      }
      return `${indent}<li><a href="${href}">${label}</a></li>`;
    })
    .join('\n');

  const list = items ? `${items}\n${indent}<hr />\n` : '';
  const dist = includeDistLink
    ? `${indent}<li><a href="./dist.json" class="version">dist.json</a></li>`
    : '';
  const html = TEMPLATE.replace('__LIST__\n', list).replace('__DIST__', dist);
  return buildResetToken ? withBuildResetMeta(html, buildResetToken) : html;
}

function relativeHref(from: t.StringDir, to: t.StringDir): string {
  const relative = Path.relative(from, to);
  if (Path.Is.absolute(relative)) {
    throw new Error(`Deploy generated index paths do not share one host root: ${from} → ${to}`);
  }
  const encoded = Path.relativePosix(relative).split('/').map(encodeURIComponent).join('/');
  return encoded.startsWith('.') ? encoded : `./${encoded}`;
}

function compareDirName(compare: (a: string, b: string) => number, a: string, b: string): number {
  const left = Str.trimLeadingDotSlash(a);
  const right = Str.trimLeadingDotSlash(b);
  return compare(left, right) || Str.Compare.codeUnit()(left, right);
}

function escapeHtml(input: string): string {
  return input
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

async function shouldOverwrite(target: string, force: boolean): Promise<boolean> {
  if (!force) return false;
  const res = await Fs.readText(target);
  if (!res.ok || !Is.str(res.data)) {
    throw res.error ?? new Error(`Deploy staged index could not be read: ${target}`);
  }
  return res.data.includes(MARKER_TOKEN);
}
