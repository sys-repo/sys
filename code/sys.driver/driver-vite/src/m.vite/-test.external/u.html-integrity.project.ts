import { Fs, Str } from '../../-test.ts';

/** Author the child project; its config deliberately disagrees with the CLI base. */
export async function writeIntegrityProject(root: string) {
  await Fs.write(
    Fs.join(root, 'index.html'),
    Str.dedent(`
      <!doctype html>
      <html><head><title>SRI proof</title></head><body>
        <div id="probe">Integrity</div>
        <script type="module" src="./main.js"></script>
      </body></html>
    `),
  );
  await Fs.write(
    Fs.join(root, 'main.js'),
    Str.dedent(`
      import './main.css';
      globalThis.integrityEntry = 'original';
    `),
  );
  await Fs.write(Fs.join(root, 'main.css'), '#probe { color: rgb(12, 34, 56); }');
  await Fs.write(Fs.join(root, 'vite.config.ts'), childConfig());
}

/** This program executes in the real driver child, not in the parent test process. */
function childConfig() {
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
        plugins: { react: false },
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
