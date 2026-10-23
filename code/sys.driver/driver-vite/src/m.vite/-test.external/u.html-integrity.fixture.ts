import { build, type InlineConfig } from 'vite';
import { expect, Fs, Hash, Is, Json, Pkg, Str, type t, Try } from '../../-test.ts';
import { VitePlugins } from '../../m.vite.plugins/mod.ts';
import { writeLocalFixtureImports } from '../-test/u.bridge.fixture.ts';
import { Vite } from '../mod.ts';
import { writeIntegrityProject } from './u.html-integrity.project.ts';

export type IntegrityAsset = {
  readonly url: string;
  readonly integrity: string;
  readonly source: string;
};
export type IntegrityFixture = {
  readonly html: string;
  readonly js: IntegrityAsset;
  readonly css: IntegrityAsset;
  dispose(): Promise<void>;
};
export type ShadowBoundary = {
  readonly mode: 'open' | 'closed';
  readonly outerMode?: 'open' | 'closed';
};

/** Build through the driver, then attest written bytes before any browser receives them. */
export async function buildIntegrityFixture(base: string): Promise<IntegrityFixture> {
  const tmp = await Fs.makeTempDir({ prefix: 'Vite.html-integrity.chromium.' });
  const root = tmp.absolute;
  let restore: (() => Promise<void>) | undefined;
  const dispose = async () => {
    try {
      if (restore) await restore();
    } finally {
      await Fs.remove(root);
    }
  };
  try {
    await writeIntegrityProject(root);
    restore = await writeLocalFixtureImports(root);
    const paths = Vite.Config.paths({ cwd: root, app: { entry: './index.html', base } });
    const built = await Vite.build({ paths, silent: true, spinner: false, exitOnError: false });
    expect(built.ok, built.toString()).to.eql(true);
    if (!built.ok) throw new Error(built.toString());

    const dir = Fs.join(root, 'dist');
    const html = await readAttestedHtml(dir, built.dist);
    const js = await readIntegrityAsset(dir, html, base, 'module');
    const css = await readIntegrityAsset(dir, html, base, 'style');
    expectOverlappingPreload(html, js);
    return { html, js, css, dispose };
  } catch (error) {
    await dispose();
    throw error;
  }
}

/** Inject select markup after Vite's HTML processing, before integrity finalization. */
export async function buildSelectIntegrityFixture(base: string) {
  const tmp = await Fs.makeTempDir({ prefix: 'vite.html-integrity.select.' });
  const root = tmp.absolute;
  const dispose = async () => void await Fs.remove(root);
  try {
    const url = new URL('select.css', base).href;
    const caller = selectStylesheetPlugin(url);
    await Fs.write(
      Fs.join(root, 'index.html'),
      Str.dedent(`
        <!doctype html>
        <html><head><title>Select proof</title></head><body>
          <div id="probe">Proof</div>
        </body></html>
      `),
    );
    const config: InlineConfig = {
      root,
      base,
      configFile: false,
      logLevel: 'silent',
      css: { postcss: { plugins: [] } },
    };
    await build({ ...config, plugins: [caller] });
    const html = await readText(Fs.join(root, 'dist/index.html'));
    const source = await readText(Fs.join(root, 'dist/select.css'));
    expect(html).to.include('<select><link');
    expect(html).not.to.include('integrity=');

    const refusal = await buildRefusal({
      ...config,
      plugins: [caller, VitePlugins.HtmlIntegrity.plugin()],
    });
    return { html, css: { url, source, integrity: expectedSri(source) }, refusal, dispose };
  } catch (error) {
    await dispose();
    throw error;
  }
}

/** Let Vite consume authored shadow CSS; retain its rewritten link for browser observation. */
export async function buildShadowIntegrityFixture(base: string, boundary: ShadowBoundary) {
  const tmp = await Fs.makeTempDir({ prefix: 'vite.html-integrity.shadow.' });
  const root = tmp.absolute;
  const dispose = async () => void await Fs.remove(root);
  try {
    await Fs.write(Fs.join(root, 'index.html'), shadowHtml(boundary));
    await Fs.write(Fs.join(root, 'shadow.css'), '#probe { color: rgb(12, 34, 56); }');
    const config: InlineConfig = {
      root,
      base,
      configFile: false,
      logLevel: 'silent',
      css: { postcss: { plugins: [] } },
      build: { assetsInlineLimit: 0 },
    };
    await build(config);
    const html = await readText(Fs.join(root, 'dist/index.html'));
    const tag = /<link\b[^>]*id="shadow-style"[^>]*>/.exec(html)?.[0];
    const url = /href="([^"]+)"/.exec(tag ?? '')?.[1];
    if (!tag || !url?.startsWith(base)) throw new Error('fixture: missing emitted shadow CSS URL');
    expect(tag).not.to.include('integrity=');
    expect(tag).not.to.include('crossorigin');
    const source = await readText(Fs.join(root, 'dist', url.slice(base.length)));

    const refusal = await buildRefusal({
      ...config,
      plugins: [VitePlugins.HtmlIntegrity.plugin()],
    });
    return { html, css: { url, source, integrity: expectedSri(source) }, refusal, dispose };
  } catch (error) {
    await dispose();
    throw error;
  }
}

/** Recompute from source bytes, independently of the plugin's parser and digest cache. */
export function expectedSri(source: string) {
  return Hash.sha256(source, { encoding: 'base64' });
}

/** Fail on missing fixture output rather than substituting an empty successful artifact. */
async function readText(path: string): Promise<string> {
  const { data } = await Fs.readText(path);
  if (data === undefined) throw new Error(`fixture: missing written output ${path}`);
  return data;
}

/** Observe refusal here; assert it only after the browser controls have run. */
async function buildRefusal(config: InlineConfig): Promise<string | undefined> {
  const { result } = await Try.run(() => build(config));
  return result.ok ? undefined : result.error.message;
}

/** The manifest must describe the integrity-bearing HTML actually written by the child. */
async function readAttestedHtml(dir: string, dist: t.DistPkg): Promise<string> {
  const htmlBytes = (await Fs.read(Fs.join(dir, 'index.html'))).data;
  if (!htmlBytes) throw new Error('fixture: missing emitted HTML');
  const html = new TextDecoder().decode(htmlBytes);
  expect(Pkg.Dist.Part.hash(dist.hash.parts['index.html'])).to.eql(Hash.sha256(htmlBytes));
  const manifest = (await Fs.readJson<t.DistPkg>(Fs.join(dir, 'dist.json'))).data;
  expect(manifest).to.eql(dist);
  const toolchain = (await Fs.readJson(Fs.join(dir, 'toolchain.json'))).data;
  expect(toolchain).to.have.keys(['vite', 'rolldown']);
  console.info('SRI child toolchain:', Json.stringify(toolchain));
  expect(html).not.to.include('/wrong-config-base/');
  return html;
}

/** Controlled Vite output uses quoted attributes; this is not a general HTML parser. */
async function readIntegrityAsset(
  dir: string,
  html: string,
  base: string,
  kind: 'module' | 'style',
): Promise<IntegrityAsset> {
  const pattern = kind === 'module' ? /<script\b[^>]+>/g : /<link\b[^>]*rel="stylesheet"[^>]*>/g;
  const attribute = kind === 'module' ? /src="([^"]+)"/ : /href="([^"]+)"/;
  const tags = [...html.matchAll(pattern)];
  expect(tags.length).to.eql(1);
  const tag = tags[0][0];
  const url = attribute.exec(tag)?.[1];
  const integrity = /integrity="([^"]+)"/.exec(tag)?.[1];
  if (!url?.startsWith(base) || !integrity) {
    throw new Error('fixture: missing integrity or CLI base');
  }
  const source = await readText(Fs.join(dir, url.slice(base.length)));
  expect(integrity).to.eql(expectedSri(source));
  return { url, integrity, source };
}

function expectOverlappingPreload(html: string, js: IntegrityAsset): void {
  const preload = /<link[^>]*rel="modulepreload"[^>]*>/.exec(html)?.[0] ?? '';
  expect(preload).to.include(`href="${js.url}"`);
  expect(preload).to.include(`integrity="${js.integrity}"`);
  expect(preload).to.include('crossorigin="anonymous"');
}

function selectStylesheetPlugin(url: string): t.VitePlugin {
  return {
    name: 'fixture:select-stylesheet',
    enforce: 'post',
    generateBundle: {
      order: 'post',
      handler(_options, bundle) {
        this.emitFile({
          type: 'asset',
          fileName: 'select.css',
          source: '#probe { color: rgb(12, 34, 56); }',
        });
        const markup = `<select><link id="select-style" rel="stylesheet" href="${url}"></select>`;
        for (const output of Object.values(bundle)) {
          if (output.type !== 'asset' || !output.fileName.endsWith('.html')) continue;
          if (!Is.str(output.source)) continue;
          output.source = output.source.replace('<body>', `<body>${markup}`);
        }
      },
    },
  };
}

function shadowHtml(boundary: ShadowBoundary): string {
  const inner = Str.dedent(`
    <sri-host id="host"><template shadowrootmode="${boundary.mode}">
      <link id="shadow-style" rel="stylesheet" media="all" href="./shadow.css">
      <span id="probe">Proof</span>
    </template></sri-host>
  `);
  const body = boundary.outerMode
    ? Str.dedent(`
      <sri-host id="outer"><template shadowrootmode="${boundary.outerMode}">
        ${inner}
      </template></sri-host>
    `)
    : inner;
  return Str.dedent(`
    <!doctype html>
    <html><head><title>Shadow proof</title></head><body>
      ${body}
    </body></html>
  `);
}
