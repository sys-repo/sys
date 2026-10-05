// Stable task entry: keep all real-build proof out of the routine unit-only lane.
import './-html-integrity.app.build.ts';
import './-html-integrity.input.build.ts';
import './-html-integrity.fixture.build.ts';

import { build } from 'vite';
import { describe, expect, Fs, Is, it, Str, type t } from '../../../-test.ts';
import { VitePlugins } from '../../mod.ts';
import { createFixture, expectDevelopment, expectWritten, readBuiltHtml } from './u.fixture.ts';

const SOURCEMAPS = [false, true, 'inline', 'hidden'] as const;
const BASES = ['./', '', '/release/', 'https://cdn.example/release/'];
const OUTPUTS = SOURCEMAPS.flatMap((sourcemap) => BASES.map((base) => ({ sourcemap, base })));

// Read back written files, not the plugin's in-memory digest cache.
describe('VitePlugins.HtmlIntegrity → written build output', () => {
  for (const { sourcemap, base } of OUTPUTS) {
    it(`dynamic imports + CSS + nested HTML: base=${base || '(empty)'}, map=${sourcemap}`, async () => {
      await using fixture = await createFixture();
      const { root, config } = fixture;
      await build({ ...config, base, build: { ...config.build, sourcemap } });
      await expectWritten(root, base);
    });
  }

  it('includes supported caller byte/HTML mutations before finalization', async () => {
    await using fixture = await createFixture();
    const { root, config } = fixture;
    const plugins = [callerMutation(), VitePlugins.HtmlIntegrity.plugin()];
    await build({ ...config, plugins });
    await expectWritten(root, './', 3);
  });

  it('remains default-off and absent from development HTML', async () => {
    await using fixture = await createFixture();
    const { root, config } = fixture;
    await build({ ...config, plugins: [] });
    expect(await readBuiltHtml(root)).not.to.include('integrity=');
    await expectDevelopment(config);
  });

  it('protects resolver-backed module and CSS outputs when source metadata is absent', async () => {
    await using fixture = await createFixture();
    const { root, config } = fixture;
    const html = Str.dedent(`
      <script type="module" src="virtual:entry"></script>
      <link rel="stylesheet" href="virtual:sheet.css">
    `);
    await Fs.write(Fs.join(root, 'nested/index.html'), html, { throw: true });
    const plugins = [virtualSources(), VitePlugins.HtmlIntegrity.plugin()];
    await build({ ...config, plugins });
    await expectWritten(root, './');
  });

  const externalScripts = [
    'https://other.example/main.js',
    '//other.example/main.js',
    'data:text/javascript,void(0)',
  ];
  for (const url of externalScripts) {
    it(`preserves a retained external script and its authored constraints: ${url}`, async () => {
      await using fixture = await createFixture();
      const { root, config } = fixture;
      const html =
        `<script type="module" src="${url}" integrity="sha384-authored" crossorigin="use-credentials"></script>`;
      await Fs.write(Fs.join(root, 'nested/index.html'), html, { throw: true });
      await build(config);
      expect(await readBuiltHtml(root)).to.include(html);
    });
  }

  const externalStyles = [
    'https://other.example/main.css',
    '//other.example/main.css',
    'data:text/css,body{}',
  ];
  for (const url of externalStyles) {
    it(`preserves a retained external stylesheet and its authored constraints: ${url}`, async () => {
      await using fixture = await createFixture();
      const { root, config } = fixture;
      const html =
        `<link rel="stylesheet" href="${url}" integrity="sha384-authored" crossorigin="use-credentials">`;
      await Fs.write(Fs.join(root, 'nested/index.html'), html, { throw: true });
      await build(config);
      expect(await readBuiltHtml(root)).to.include(html);
    });
  }
});

// Separate test boundaries expose background work escaping transform-only server shutdown.
// Repeating startup matters: a leaked operation may finish in the following test.
for (const count of [1, 2, 3, 4]) {
  Deno.test(`HTML integrity → transform-only development lifecycle ${count}`, async () => {
    await using fixture = await createFixture();
    await expectDevelopment(fixture.config);
  });
}

function callerMutation(): t.VitePlugin {
  return {
    name: 'fixture:mutate-before-integrity',
    enforce: 'post',
    generateBundle: {
      order: 'post',
      handler: (_options, bundle) => Object.values(bundle).forEach(mutateOutput),
    },
  };
}

/** Mutate JS/CSS bytes and introduce a second loading path to the same entry module. */
function mutateOutput(output: t.Rollup.OutputChunk | t.Rollup.OutputAsset): void {
  if (output.type === 'chunk') {
    output.code += '\n;globalThis.callerMutation = true;';
    return;
  }
  if (!Is.str(output.source)) return;
  if (output.fileName.endsWith('.css')) output.source += '\nbody { margin: 1px; }';
  if (!output.fileName.endsWith('.html')) return;

  const src = /src="([^"]+)"/.exec(output.source)?.[1];
  if (!src) throw new Error('fixture: missing entry URL');
  output.source = `<link rel="modulepreload" href="${src}">\n${output.source}`;
}

function virtualSources(): t.VitePlugin {
  return {
    name: 'fixture:unconstrained-virtual-sources',
    resolveId: (id) => id.startsWith('virtual:') ? `\0${id}` : undefined,
    load(id) {
      if (id === '\0virtual:entry') return 'globalThis.resolverEntry = true;';
      if (id === '\0virtual:sheet.css') return 'body { color: rgb(12, 34, 56); }';
    },
  };
}
