import { expect, Fs, Hash, Is } from '../../-test.ts';
import type { IntegrityProduct, IntegrityReference } from './t.html-integrity.ts';

type Resource = {
  readonly kind: IntegrityReference['kind'];
  readonly url: string;
  readonly tag: string;
};

/** Attest controlled Vite products without the production parser or integrity-only selection. */
export async function attestIntegrity(
  outDir: string,
  base = './',
  htmlFile = 'index.html',
): Promise<IntegrityProduct> {
  const html = (await Fs.readText(Fs.join(outDir, htmlFile))).data;
  if (!Is.str(html)) throw new Error(`Missing written HTML: ${outDir}/${htmlFile}`);
  // These products contain ordinary quoted Vite tags. Refuse parser-boundary syntax, not omit it.
  expect(html).not.to.match(/<(?:base|select|template)\b/i);
  const resources: Resource[] = [];
  for (const [tag, name] of html.matchAll(/<(script|link)\b[^>]*>/gi)) {
    const type = attribute(tag, 'type');
    const rel = attribute(tag, 'rel')?.toLowerCase().split(/\s+/) ?? [];
    const kind = name.toLowerCase() === 'script' && type === 'module'
      ? 'module'
      : rel.includes('stylesheet')
      ? 'stylesheet'
      : rel.includes('modulepreload')
      ? 'modulepreload'
      : undefined;
    if (!kind) continue;
    const url = attribute(tag, name.toLowerCase() === 'script' ? 'src' : 'href');
    // These emitted products have linked module entries; an absent URL must not shrink coverage.
    if (!url) throw new Error(`Missing effective resource URL: ${tag}`);
    resources.push({ kind, url, tag });
  }

  const rootUrl = new URL(base, 'https://sri.invalid/');
  const htmlUrl = new URL(htmlFile, rootUrl);
  const moduleUrls = new Set(
    resources.filter((item) => item.kind === 'module').map((item) =>
      new URL(item.url, htmlUrl).href
    ),
  );
  const references: IntegrityReference[] = [];
  const external: string[] = [];
  for (const item of resources) {
    const url = new URL(item.url, htmlUrl);
    if (url.origin !== rootUrl.origin || !url.pathname.startsWith(rootUrl.pathname)) {
      external.push(item.url);
      continue;
    }
    if (item.kind === 'modulepreload' && !moduleUrls.has(url.href)) continue;
    const path = decodeURIComponent(url.pathname.slice(rootUrl.pathname.length));
    const bytes = (await Fs.read(Fs.resolve(outDir, path))).data;
    if (!bytes) throw new Error(`Missing written resource: ${path}`);
    const digest = Hash.sha256(bytes, { encoding: 'base64' });
    const integrity = attribute(item.tag, 'integrity');
    if (!integrity) throw new Error(`Missing effective integrity: ${item.url}`);
    expect(integrity, item.url).to.eql(digest);
    expect(item.tag, item.url).to.match(
      /[\t\n\f\r ]crossorigin(?:="(?:anonymous)?"|='(?:anonymous)?')?(?=[\t\n\f\r ]|\/?>)/,
    );
    references.push({ kind: item.kind, url: item.url, path, digest });
  }
  expect(references.some((item) => item.kind === 'module'), 'nonempty owned module coverage').to
    .eql(true);
  return { html, references, external };
}

/** Exact quoted attribute names, not data-* aliases, in the controlled generated products. */
function attribute(tag: string, name: string): string | undefined {
  const pattern = new RegExp(`[\\t\\n\\f\\r ]${name}=(?:"([^"]*)"|'([^']*)')`, 'i');
  const match = pattern.exec(tag);
  return match?.[1] ?? match?.[2];
}
