import { Fs, Json, Str } from '../../-test.ts';

/** Author the child project; its config deliberately disagrees with the CLI base. */
export async function writeIntegrityProject(
  root: string,
  options: { mode?: 'local-asset-composition' } = {},
) {
  await Fs.write(
    Fs.join(root, 'index.html'),
    Str.dedent(`
      <!doctype html>
      <html><head><title>SRI proof</title></head><body>
        <div id="probe">Integrity</div>
        <script type="module" src="./main.js"></script>
      </body></html>
    `),
    { throw: true },
  );
  await Fs.write(
    Fs.join(root, 'main.js'),
    Str.dedent(`
      import './main.css';
      globalThis.integrityEntry = 'original';
    `),
    { throw: true },
  );
  await Fs.write(Fs.join(root, 'main.css'), '#probe { color: rgb(12, 34, 56); }', { throw: true });
  await Fs.write(Fs.join(root, 'vite.config.ts'), childConfig(options.mode), {
    throw: true,
  });
}

/** This program executes in the real driver child, not in the parent test process. */
function childConfig(mode?: 'local-asset-composition') {
  // Dist composition needs real local assets/SRI, not an additional Deno resolver proof.
  const plugins = mode === 'local-asset-composition'
    ? { react: false, deno: false, wasm: false, optimizeImports: false }
    : { react: false };
  return Str.dedent(`
    import { createRequire } from 'node:module';
    import type { Plugin } from 'vite';
    import { Vite } from '@sys/driver-vite';
    import { VitePlugins } from '@sys/driver-vite/plugins';
    import { Fs } from '@sys/fs';
    import { Json } from '@sys/std/json';
    import { Is } from '@sys/std/is';

    const caller: Plugin = {
      name: 'fixture:toolchain-and-overlapping-preload',
      enforce: 'post',
      generateBundle: {
        order: 'post',
        async handler(_options, bundle) {
          const toolchain = await readToolchain();
          this.emitFile({
            type: 'asset',
            fileName: 'toolchain.json',
            source: Json.stringify(toolchain),
          });
          for (const output of Object.values(bundle)) {
            if (output.type !== 'asset' || !output.fileName.endsWith('.html')) continue;
            if (!Is.str(output.source)) continue;
            output.source = prepareHtml(output.source);
          }
        },
      },
    };

    export default Vite.Config.define(async () => {
      const config = await Vite.Config.app({
        paths: Vite.Config.paths({
          app: { entry: './index.html', base: '/wrong-config-base/' },
        }),
        plugins: ${Json.stringify(plugins)},
        workspace: false,
        vitePlugins: [caller, VitePlugins.HtmlIntegrity.plugin()],
      });
      return { ...config, css: { postcss: { plugins: [] } } };
    });

    async function readToolchain() {
      const require = createRequire(Fs.join(import.meta.dirname ?? '.', 'package.json'));
      const vitePath = require.resolve('vite/package.json');
      const rolldownPath = createRequire(vitePath).resolve('rolldown/package.json');
      const vite = (await Fs.readJson<{ version: string }>(vitePath)).data;
      const rolldown = (await Fs.readJson<{ version: string }>(rolldownPath)).data;
      if (!vite || !rolldown) throw new Error('fixture: missing child toolchain identity');
      return { vite: vite.version, rolldown: rolldown.version };
    }

    function prepareHtml(html: string) {
      const src = /<script[^>]+src="([^"]+)"/.exec(html)?.[1];
      if (!src) throw new Error('fixture: missing module entry');
      const preload = '<link rel="modulepreload" href="' + src + '">';
      html = html.replace('<head>', '<head>' + preload);
      // Valid HTML: the slash is attribute data, not self-closing syntax.
      return html.replace(
        /<link[^>]*rel="stylesheet"[^>]*>/g,
        (tag) => tag.slice(0, -1) + ' data-x=/>',
      );
    }
  `);
}
