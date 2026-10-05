import deno from '@deno/vite-plugin';
import { build, type Plugin, version as viteVersion } from 'vite';
import { brotliCompressSync, constants, gzipSync } from 'node:zlib';
import { Browser, describe, expect, Fs, Is, it, Json, Obj, Str, Testing } from './common.ts';
import { hello } from './entry.html.ts';
import { hello as directHello } from './entry.parse5.ts';

type Artifact = Awaited<ReturnType<typeof bundle>>;

type Proof = {
  readonly result: { readonly value: string; readonly spelling: string };
  readonly userAgent: string;
  readonly deno: string;
  readonly process: string;
};

const expected = { value: '/hello?x=1&y=2', spelling: 'href="/hello?x=1&amp;y=2"' };
const root = Fs.dirname(Fs.dirname(import.meta.dirname!));

describe('Html browser and footprint proof', () => {
  it('runs the same public-entry example in Deno and sandboxed Chrome, without Node shims', async () => {
    expect(hello()).to.eql(expected);
    expect(directHello()).to.eql(expected);
    console.info(
      'Runtime:',
      Deno.version,
      'Vite:',
      viteVersion,
      'target: es2022; minifier: oxc; format: es',
    );

    const html = await bundle('html');
    const direct = await bundle('parse5');
    const types = await bundle('types');
    assertGraphs(html, direct, types);

    const entries = [['html', html], ['parse5', direct]] as const;
    for (const [name, artifact] of entries) {
      console.info(name, measureFootprint(artifact));
      await verifyBrowser(name, artifact);
    }
  });
});

const forbiddenDependencies = [
  /node:/,
  /__vite-browser-external/,
  /\/sys\/(?:fs|cli)\//,
  /\/sys\.ui\//,
  /\/sys\.driver\//,
  /\/(?:magic-string|vite|react|react-dom)\//,
  /\/(?:parse5-parser-stream|parse5-sax-parser)\//,
];

function isForbiddenDependency(id: string): boolean {
  return forbiddenDependencies.some((pattern) => pattern.test(id));
}

function assertGraphs(html: Artifact, direct: Artifact, types: Artifact) {
  expect(types.code.trim()).to.eql('');
  expect(types.rendered).to.eql([]);
  expect(types.graph).to.eql([Fs.join(root, 'src/types.ts')]);
  expect(html.graph.some((id) => id.includes('/parse5/'))).to.eql(true);
  expect(html.graph.some((id) => id.includes('/entities/'))).to.eql(true);
  for (const artifact of [html, direct, types]) {
    const forbidden = artifact.graph.filter(isForbiddenDependency);
    expect(forbidden).to.eql([]);
  }
}

function measureFootprint(artifact: Artifact) {
  return {
    bytes: new TextEncoder().encode(artifact.code).byteLength,
    gzip: gzipSync(artifact.code, { level: 9 }).byteLength,
    brotli: brotliCompressSync(artifact.code, {
      params: { [constants.BROTLI_PARAM_QUALITY]: 11 },
    }).byteLength,
    rendered: artifact.rendered,
    graph: artifact.graph,
  };
}

async function verifyBrowser(name: string, artifact: Artifact) {
  const reports: Proof[] = [];
  const server = Testing.Http.server(async (request) => {
    const path = new URL(request.url).pathname;
    if (path === '/favicon.ico') return new Response(null, { status: 204 });
    if (path === '/entry.js') {
      return new Response(artifact.code, { headers: { 'content-type': 'text/javascript' } });
    }
    if (path === '/proof' && request.method === 'POST') {
      const parsed = Json.safeParse<Proof>(await request.text());
      if (!parsed.ok || !parsed.data) throw new Error('invalid trusted proof payload');
      reports.push(parsed.data);
      return new Response(null, { status: 204 });
    }
    if (path !== '/') return new Response(null, { status: 404 });
    return new Response(
      Str.dedent(`
        <!doctype html><title>Html proof</title>
        <script type="module">
          import { hello } from '/entry.js';
          await fetch('/proof', {
            method: 'POST',
            body: JSON.stringify({
              result: hello(), userAgent: navigator.userAgent,
              deno: typeof Deno, process: typeof process,
            }),
          });
        </script>
      `),
      { headers: { 'content-type': 'text/html' } },
    );
  });
  try {
    const browser = await Browser.load(server.url.raw);
    expect(browser.errors, browser.stderr).to.eql([]);
    expect(browser.ok).to.eql(true);
    expect(reports).to.have.length(1);
    const report = reports[0];
    expect(report.result).to.eql(expected);
    expect(report.deno).to.eql('undefined');
    expect(report.process).to.eql('undefined');
    console.info(name, 'browser:', report.userAgent);
  } finally {
    await server.dispose();
  }
}

/** Both entries share build settings and resolve through the actual workspace/import map. */
async function bundle(name: 'html' | 'parse5' | 'types') {
  const graph = new Set<string>();
  const audit: Plugin = {
    name: 'html-proof-graph',
    generateBundle() {
      console.info(name, 'Rolldown:', this.meta.rolldownVersion);
      for (const id of this.getModuleIds()) {
        const info = this.getModuleInfo(id);
        if (!info) throw new Error(`missing module info: ${id}`);
        for (const entry of [id, ...info.importedIds, ...info.dynamicallyImportedIds]) {
          graph.add(entry);
        }
      }
    },
  };
  const result = await build({
    root,
    configFile: false,
    logLevel: 'error',
    plugins: [...deno({ workspaceOptions: { platform: 'browser' } }), audit],
    build: {
      write: false,
      target: 'es2022',
      minify: 'oxc',
      lib: {
        entry: Fs.join(
          root,
          name === 'types' ? 'src/types.ts' : `src/-test.browser/entry.${name}.ts`,
        ),
        formats: ['es'],
      },
    },
  });
  const outputs = Is.array(result) ? result : [result];
  expect(outputs).to.have.length(1);
  const output = outputs[0];
  if (!('output' in output)) throw new Error('expected a bundle, not a watcher');
  const chunks = output.output.filter((item) => item.type === 'chunk');
  expect(chunks).to.have.length(1);
  const chunk = chunks[0];
  expect(chunk.imports).to.eql([]);
  expect(chunk.dynamicImports).to.eql([]);
  return {
    code: chunk.code,
    graph: [...graph].sort(),
    rendered: Obj.keys(chunk.modules).filter((id) => chunk.modules[id].renderedLength > 0),
  };
}
