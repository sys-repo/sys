import { Fs, Http, SAMPLE, Testing, Url, pkg, type t } from '../../-test.ts';
import { Vite } from '../mod.ts';

type DevResponse = {
  readonly url: string;
  readonly status: number;
  readonly contentType: string;
  readonly text: string;
};

export type DevModule = DevResponse & {
  readonly imports: readonly string[];
};

export type DevSample = {
  readonly dev: t.ViteProcess;
  readonly html: DevResponse;
  readonly entry: DevResponse;
  readonly modules: readonly DevModule[];
  readonly fetch: (url: string) => Promise<DevResponse>;
};

export async function devSample(args: {
  sampleName?: string;
  sampleDir?: t.StringDir;
  cwd?: t.StringDir;
}): Promise<DevSample> {
  const { sampleName, sampleDir, cwd } = args;
  const port = Testing.randomPort();
  const fs = sampleName ? await SAMPLE.fs(sampleName).create() : undefined;
  const dir = cwd ?? fs?.dir;
  if (!dir) throw new Error('Expected either "cwd" or "sampleName"');
  if (fs && sampleDir) {
    await Fs.remove(fs.dir);
    await Fs.copy(sampleDir, fs.dir);
  }

  const dev = await Vite.dev({ cwd: dir, port, pkg, silent: true });

  try {
    await Http.Client.waitFor(dev.url, { timeout: 10_000, interval: 200 });

    const html = await fetchModule(dev.url);
    const entryUrl = wrangle.entryUrl(html);
    const entry = await fetchModule(entryUrl);
    const modules = await crawlModules(entryUrl, entry.text);

    return { dev, html, entry, modules, fetch: fetchModule };
  } catch (error) {
    await dev.dispose();
    throw error;
  }
}

async function fetchModule(url: string): Promise<DevResponse> {
  const res = await fetch(url);
  return {
    url,
    status: res.status,
    contentType: res.headers.get('content-type') ?? '',
    text: await res.text(),
  };
}

async function crawlModules(entryUrl: string, text: string): Promise<readonly DevModule[]> {
  const queue = wrangle.imports(entryUrl, text);
  const seen = new Set<string>();
  const modules: DevModule[] = [];

  while (queue.length > 0 && modules.length < 128) {
    const url = queue.shift()!;
    if (seen.has(url)) continue;
    seen.add(url);

    const response = await fetchModule(url);
    const imports = wrangle.isJavaScript(response) ? wrangle.imports(url, response.text) : [];
    const mod: DevModule = { ...response, imports };
    modules.push(mod);
    if (!wrangle.isJavaScript(mod)) continue;

    for (const next of mod.imports) {
      if (!seen.has(next)) queue.push(next);
    }
  }

  return modules;
}

const wrangle = {
  entryUrl(html: DevResponse) {
    const matches = [
      ...html.text.matchAll(/<script[^>]+type=["']module["'][^>]+src=["']([^"']+)["']/gi),
    ].map((match) => match[1]);
    const entry = matches.find((src) => !src.includes('@vite/client')) ?? matches[0];
    if (typeof entry !== 'string') {
      throw new Error(`Failed to locate module entry in html: ${html.url}`);
    }
    return this.resolve(html.url, entry);
  },

  imports(baseUrl: string, text: string) {
    const values = [
      ...text.matchAll(/\bimport\s*\(\s*["']([^"']+)["']\s*\)/g),
      ...text.matchAll(/\bimport\s+[^"'`]*?\bfrom\s+["']([^"']+)["']/g),
      ...text.matchAll(/\bexport\s+[^"'`]*?\bfrom\s+["']([^"']+)["']/g),
    ].map((match) => match[1]);

    return [...new Set(values.map((value) => this.resolve(baseUrl, value)).filter(Boolean))];
  },

  resolve(baseUrl: string, value: string) {
    const parsed = Url.parse(value);
    if (parsed.ok) return parsed.href;
    if (value.startsWith('/') || value.startsWith('./') || value.startsWith('../')) {
      return new URL(value, baseUrl).href;
    }
    if (value.startsWith('@') || /^[a-z0-9][^:]*$/i.test(value)) {
      return new URL(`/@id/${encodeURIComponent(value)}`, baseUrl).href;
    }
    return '';
  },

  isJavaScript(res: DevResponse) {
    return (
      res.contentType.includes('javascript') ||
      res.contentType.includes('typescript') ||
      res.contentType.includes('application/json')
    );
  },
} as const;
