import { type t, Fs, Str } from '../common.ts';

export type RewritePathsResponse = {
  readonly base: t.StringPath;
  readonly files: RewriteFile[];
};
export type RewriteFile = {
  readonly path: t.StringPath;
  readonly base: t.StringDir;
  readonly html: { readonly before: string; readonly after: string };
};

/**
 * Rewrites an `index.html` using the original `dist.json` manifest as
 * the authoritative source of asset paths.
 *
 * Steps:
 *   1. Reset all `<script src>` / `<link href>` asset URLs in the HTML
 *      to their original values from the manifest.
 *   2. Inject a `<base>` tag that rebases all relative URLs to the
 *      mount-point directory used by the serve tool.
 *
 * Effect:
 *   The HTML becomes self-consistent under the chosen local bundle.
 */

export async function rewriteTags(baseDir: t.StringDir, bundleConfig: t.ServeTool.DirRemoteBundle) {
  const glob = Fs.glob(Fs.join(baseDir, bundleConfig.local.dir));
  const paths = await glob.find('**/index.html');

  const loadFile = async (path: t.StringPath): Promise<RewriteFile | undefined> => {
    const before = (await Fs.readText(path)).data;
    if (!before) return undefined;
    const html = { before, after: before };
    return {
      path,
      base: Str.ensureSlashWrapped(Fs.dirname(path).slice(baseDir.length)),
      get html() {
        return html;
      },
    };
  };

  const mutateHtml = (file: RewriteFile, after: string) => {
    const html = file.html as t.DeepMutable<RewriteFile['html']>;
    html.after = after;
  };

  const loading = paths.map((f) => f.path).map(loadFile);
  const files = (await Promise.all(loading)).filter(Boolean) as RewriteFile[];
  const res: RewritePathsResponse = {
    base: baseDir,
    get files() {
      return files;
    },
  };

  function rewritePaths(file: RewriteFile) {
    const after = mutatePaths(file.html.before, (e) => {
      if (e.tagname === 'base') e.mutate(file.base);
      if (e.path.includes('/./')) e.mutate(e.path.slice(e.path.indexOf('/./') + 1));
    });
    if (file.html.before !== after) mutateHtml(file, after);
  }

  function ensureBaseTag(file: RewriteFile) {
    if (file.html.after.includes('<base')) return;
    mutateHtml(file, insertBaseTag(file.html.after, file.base));
  }

  // Rewrite paths on each `index.html` file; ensure <base> tag exists on each one:
  files.forEach(rewritePaths);
  files.forEach(ensureBaseTag);

  // Write changes to file system:
  for (const file of files) {
    if (file.html.before === file.html.after) continue; // no change.
    await Fs.write(file.path, file.html.after, { force: true });
  }

  return res;
}

/**
 * Find all tags that have either an `href` or `src` property
 * and call the fn() passing:
 *  - tag: the complete tag element, eg., <link rel="modulepreload" crossorigin href="/path/to/./pkg/m.C_5SYDux.js">
 *  - tagname: the name of the tag only, eg "link" or "script" or "base"
 *  - path: the value of the `href` or `src`
 */
function mutatePaths(
  html: string,
  fn: (e: {
    readonly tag: string;
    readonly tagname: string;
    readonly path: t.StringPath;
    mutate(next: t.StringPath): void;
  }) => void,
): string {
  const tagRx = /<([a-zA-Z][^\s>]*)([^>]*\s(?:href|src)=["'][^"']*["'][^>]*)>/g;
  const attrRx = /(href|src)=(['"])([^'"]*)\2/i;

  let m: RegExpExecArray | null;
  while ((m = tagRx.exec(html))) {
    let tag = m[0];
    const tagname = m[1];
    const attr = attrRx.exec(tag);
    if (!attr) continue;
    let path = attr[3];

    const mutate = (next: t.StringPath) => {
      if (next === path) return;
      const newTag = tag.replace(attrRx, `${attr[1]}=${attr[2]}${next}${attr[2]}`);
      const delta = newTag.length - tag.length;

      html = html.slice(0, m!.index) + newTag + html.slice(m!.index + tag.length);
      tag = newTag;
      path = next;
      tagRx.lastIndex += delta;
    };

    fn({ tag, tagname, path, mutate });
  }

  return html;
}

function insertBaseTag(html: string, path: t.StringPath): string {
  return html.replace(/([ \t]*)<head(.*?)>/i, (match, indent) => {
    const base = `${indent}  <base href="${path}" />`;
    return `${match}\n${base}`;
  });
}
