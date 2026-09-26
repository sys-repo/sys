import { build, createServer, type InlineConfig } from 'vite';
import { describe, expect, Fs, Hash, Is, it, Json, Str, type t, Try } from '../../../-test.ts';
import { VitePlugins } from '../../mod.ts';

type Fixture = { readonly root: string; readonly config: InlineConfig };
type SubstitutionCase = {
  readonly name: string;
  readonly key: string;
  readonly target: 'type' | 'markup';
  readonly provider: 'env' | 'define';
  readonly envPrefix?: string;
};

const SOURCE = '<!doctype html><script type="module" src="../main.js"></script>';
const AUTHORED_METADATA = [
  { attribute: 'integrity="sha384-authored"', reason: 'authored input integrity' },
  { attribute: 'crossorigin="use-credentials"', reason: 'anonymous crossorigin' },
] as const;

// Read back written files, not the plugin's in-memory digest cache.
describe('VitePlugins.HtmlIntegrity → written build output', () => {
  for (const sourcemap of [false, true, 'inline', 'hidden'] as const) {
    for (const base of ['./', '', '/release/', 'https://cdn.example/release/']) {
      it(`dynamic imports + CSS + nested HTML: base=${base || '(empty)'}, map=${sourcemap}`, async () => {
        await fixture(async ({ root, config }) => {
          await build({ ...config, base, build: { ...config.build, sourcemap } });
          await expectWritten(root, base);
        });
      });
    }
  }

  it('includes supported caller byte/HTML mutations before finalization', async () => {
    await fixture(async ({ root, config }) => {
      const caller: t.VitePlugin = {
        name: 'fixture:mutate-before-integrity',
        enforce: 'post',
        generateBundle: {
          order: 'post',
          handler(_options, bundle) {
            for (const output of Object.values(bundle)) {
              if (output.type === 'chunk') output.code += '\n;globalThis.callerMutation = true;';
              if (output.type !== 'asset' || !Is.str(output.source)) continue;
              if (output.fileName.endsWith('.css')) output.source += '\nbody { margin: 1px; }';
              if (output.fileName.endsWith('.html')) {
                const src = /src="([^"]+)"/.exec(output.source)?.[1];
                if (!src) throw new Error('fixture: missing entry URL');
                output.source = `<link rel="modulepreload" href="${src}">\n${output.source}`;
              }
            }
          },
        },
      };
      await build({ ...config, plugins: [caller, VitePlugins.HtmlIntegrity.plugin()] });
      await expectWritten(root, './', 3);
    });
  });

  it('remains default-off and absent from development HTML', async () => {
    await fixture(async ({ root, config }) => {
      await build({ ...config, plugins: [] });
      const html = await readBuiltHtml(root);
      expect(html).not.to.include('integrity=');
      const dev = await createServer(config);
      try {
        const rendered = await dev.transformIndexHtml('/nested/index.html', SOURCE);
        expect(rendered).not.to.include('integrity=');
        expect(dev.config.plugins.some((plugin) => plugin.name === 'sys:html-integrity')).to.eql(
          false,
        );
      } finally {
        await dev.close();
      }
    });
  });

  for (
    const { name, html, reason } of [
      {
        name: 'module integrity',
        html: '<script type="module" src="../main.js" integrity="sha256-authored"></script>',
        reason: 'authored input integrity',
      },
      {
        name: 'module credentials',
        html: '<script type="module" src="../main.js" crossorigin="use-credentials"></script>',
        reason: 'anonymous crossorigin',
      },
      {
        name: 'stylesheet integrity',
        html: '<link rel="stylesheet" href="../main.css" integrity="sha384-authored">',
        reason: 'authored input integrity',
      },
      {
        name: 'public asset outside the bundle',
        html: '<script type="module" src="/public.js"></script>',
        reason: 'missing emitted output public.js',
      },
      { name: 'base href', html: '<base href="/elsewhere/">' + SOURCE, reason: '<base href>' },
    ]
  ) {
    it(`refuses ${name} through Vite`, async () => {
      await fixture(async ({ root, config }) => {
        await Fs.write(Fs.join(root, 'nested/index.html'), html);
        await Fs.write(Fs.join(root, 'public/public.js'), 'console.info("public");');
        await expectBuildRefusal(config, reason);
      });
    });
  }

  // Input root ownership must not be confused with the output deployment mount.
  for (const base of ['/release/', 'https://cdn.example/release/']) {
    for (
      const { name, html, reason } of [
        {
          name: 'module integrity',
          html: '<script type="module" src="/main.js" integrity="sha384-authored"></script>',
          reason: 'authored input integrity',
        },
        {
          name: 'module credentials',
          html: '<script type="module" src="/main.js" crossorigin="use-credentials"></script>',
          reason: 'anonymous crossorigin',
        },
        {
          name: 'stylesheet integrity',
          html: '<link rel="stylesheet" href="/main.css" integrity="sha384-authored">',
          reason: 'authored input integrity',
        },
      ]
    ) {
      it(`refuses consumed root-relative ${name}: base=${base}`, async () => {
        await fixture(async ({ root, config }) => {
          await Fs.write(Fs.join(root, 'nested/index.html'), html);
          await expectBuildRefusal({ ...config, base }, reason);
        });
      });
    }
  }

  for (const container of ['template', 'noscript']) {
    for (const kind of ['module', 'style']) {
      for (const { attribute, reason } of AUTHORED_METADATA) {
        it(`refuses Vite-consumed ${container} ${kind} ${attribute}`, async () => {
          await fixture(async ({ root, config }) => {
            const tag = kind === 'module'
              ? `<script type="module" src="../main.js" ${attribute}></script>`
              : `<link rel="stylesheet" href="../main.css" ${attribute}>`;
            await Fs.write(
              Fs.join(root, 'nested/index.html'),
              `<!doctype html><html><head></head><body><${container}>${tag}</${container}></body></html>`,
            );
            // Control: this source reaches Vite's consumption path and loses its metadata.
            await build({ ...config, plugins: [] });
            const control = await readBuiltHtml(root);
            expect(control).to.include(kind === 'module' ? 'type="module"' : 'rel="stylesheet"');
            expect(control).not.to.include(attribute);
            expect(control).not.to.include(kind === 'module' ? '../main.js' : '../main.css');

            await expectBuildRefusal(config, reason);
          });
        });
      }
    }
  }

  // Each source form names the active output that proves Vite consumed it.
  // Test integrity and credentials separately: either constraint must cause refusal.
  for (const { attribute, reason } of AUTHORED_METADATA) {
    for (
      const { name, html, emitted } of [
        {
          name: 'foreign module',
          html: `<svg><script type="module" src="../main.js" ${attribute}></script></svg>`,
          emitted: 'type="module"',
        },
        {
          name: 'inline module',
          html: `<script type="module" ${attribute}>import '../main.js';</script>`,
          emitted: 'type="module"',
        },
        {
          name: 'external-src inline module',
          html:
            `<script type="module" src="https://example.invalid/main.js" ${attribute}>import '../main.js';</script>`,
          emitted: 'type="module"',
        },
        {
          name: 'preload CSS',
          html: `<link rel="preload" as="style" href="../main.css" ${attribute}>`,
          emitted: 'rel="stylesheet"',
        },
        {
          name: 'unrelated-rel CSS',
          html: `<link rel="alternate" as="style" href="../main.css" ${attribute}>`,
          emitted: 'rel="stylesheet"',
        },
        {
          name: 'encoded CSS',
          html: `<link rel="preload" as="style" href="../main%2ecss" ${attribute}>`,
          emitted: 'rel="stylesheet"',
        },
      ]
    ) {
      it(`refuses consumed ${name}: ${attribute}`, async () => {
        await fixture(async ({ root, config }) => {
          await Fs.write(Fs.join(root, 'nested/index.html'), html);

          // Opt-out control: Vite consumes the source and drops its metadata.
          await build({ ...config, plugins: [] });
          const control = await readBuiltHtml(root);
          expect(control).to.include(emitted);
          expect(control).not.to.include(attribute);

          // Opt-in: the driver must refuse before that authored constraint is lost.
          await expectBuildRefusal(config, reason);
        });
      });
    }
  }

  for (
    const { kind, url } of [
      { kind: 'module', url: 'virtual:entry' },
      { kind: 'module', url: 'jsr:@fixture/entry' },
      { kind: 'module', url: 'npm:fixture' },
      { kind: 'module', url: '@fixture/entry' },
      { kind: 'style', url: 'virtual:sheet.css' },
      { kind: 'style', url: 'virtual:sheet%2ecss' },
    ]
  ) {
    for (const { attribute, reason } of AUTHORED_METADATA) {
      it(`refuses consumed resolver-backed ${kind}: ${url} ${attribute}`, async () => {
        await fixture(async ({ root, config }) => {
          let loads = 0;
          const resolvedId = kind === 'module' ? '\0fixture-source' : '\0fixture-source.css';
          const resolver: t.VitePlugin = {
            name: 'fixture:resolver-backed-source',
            resolveId: (id) => id === decodeURI(url) ? resolvedId : undefined,
            load(id) {
              if (id !== resolvedId) return;
              loads++;
              return kind === 'module'
                ? 'globalThis.resolverEntry = true;'
                : 'body { color: rgb(12, 34, 56); }';
            },
          };
          const html = kind === 'module'
            ? `<script type="module" src="${url}" ${attribute}></script>`
            : `<link rel="preload" as="style" href="${url}" ${attribute}>`;
          await Fs.write(Fs.join(root, 'nested/index.html'), html);

          await build({ ...config, plugins: [resolver] });
          const control = await readBuiltHtml(root);
          expect(loads, 'the control must reach the source resolver').to.be.greaterThan(0);
          expect(control).to.include(kind === 'module' ? 'type="module"' : 'rel="stylesheet"');
          expect(control).not.to.include(url);
          expect(control).not.to.include(attribute);

          await expectBuildRefusal(
            { ...config, plugins: [resolver, VitePlugins.HtmlIntegrity.plugin()] },
            reason,
          );
        });
      });
    }
  }

  it('protects resolver-backed module and CSS outputs when source metadata is absent', async () => {
    await fixture(async ({ root, config }) => {
      const resolver: t.VitePlugin = {
        name: 'fixture:unconstrained-virtual-sources',
        resolveId: (id) => id.startsWith('virtual:') ? `\0${id}` : undefined,
        load(id) {
          if (id === '\0virtual:entry') return 'globalThis.resolverEntry = true;';
          if (id === '\0virtual:sheet.css') return 'body { color: rgb(12, 34, 56); }';
        },
      };
      const html = Str.dedent(`
        <script type="module" src="virtual:entry"></script>
        <link rel="stylesheet" href="virtual:sheet.css">
      `);
      await Fs.write(Fs.join(root, 'nested/index.html'), html);
      await build({ ...config, plugins: [resolver, VitePlugins.HtmlIntegrity.plugin()] });
      await expectWritten(root, './');
    });
  });

  for (
    const url of [
      'https://other.example/main.js',
      '//other.example/main.js',
      'data:text/javascript,void(0)',
    ]
  ) {
    it(`preserves a retained external script and its authored constraints: ${url}`, async () => {
      await fixture(async ({ root, config }) => {
        const html =
          `<script type="module" src="${url}" integrity="sha384-authored" crossorigin="use-credentials"></script>`;
        await Fs.write(Fs.join(root, 'nested/index.html'), html);
        await build(config);
        expect(await readBuiltHtml(root)).to.include(html);
      });
    });
  }

  for (
    const url of [
      'https://other.example/main.css',
      '//other.example/main.css',
      'data:text/css,body{}',
    ]
  ) {
    it(`preserves a retained external stylesheet and its authored constraints: ${url}`, async () => {
      await fixture(async ({ root, config }) => {
        const html =
          `<link rel="stylesheet" href="${url}" integrity="sha384-authored" crossorigin="use-credentials">`;
        await Fs.write(Fs.join(root, 'nested/index.html'), html);
        await build(config);
        expect(await readBuiltHtml(root)).to.include(html);
      });
    });
  }

  const substitutions: readonly SubstitutionCase[] = [
    { name: 'environment type', key: 'VITE_REVIEW_HTML', target: 'type', provider: 'env' },
    { name: 'environment markup', key: 'VITE_REVIEW_HTML', target: 'markup', provider: 'env' },
    { name: 'define markup', key: 'VITE_REVIEW_HTML', target: 'markup', provider: 'define' },
    {
      name: 'custom prefix',
      key: 'REVIEW_HTML',
      target: 'markup',
      provider: 'env',
      envPrefix: 'REVIEW_',
    },
  ];
  for (const { name, key, target, provider, envPrefix } of substitutions) {
    for (const { attribute } of AUTHORED_METADATA) {
      it(`refuses ${name}: ${attribute}`, async () => {
        await fixture(async ({ root, config }) => {
          const token = `%${key}%`;
          const tag = `<script type="module" src="../main.js" ${attribute}></script>`;
          const value = target === 'type' ? 'module' : tag;
          const html = target === 'type'
            ? `<script type="${token}" src="../main.js" ${attribute}></script>`
            : token;
          await Fs.write(Fs.join(root, 'nested/index.html'), html);
          await Fs.write(Fs.join(root, '.env'), `${key}='${value}'\n`);
          const next: InlineConfig = {
            ...config,
            ...(envPrefix ? { envPrefix } : {}),
            ...(provider === 'define'
              ? { define: { [`import.meta.env.${key}`]: Json.stringify(value) }, envFile: false }
              : {}),
          };

          // Expansion must actually reach Vite's consumption path in the opt-out control.
          await build({ ...next, plugins: [] });
          const control = await readBuiltHtml(root);
          expect(control).to.include('type="module"');
          expect(control).not.to.include(attribute);
          expect(control).not.to.include(token);

          await expectBuildRefusal(next, 'HTML environment substitution');
        });
      });
    }
  }

  for (const placement of ['before', 'after']) {
    it(`guards pre-consumption ordering: caller ${placement} integrity`, async () => {
      await fixture(async ({ root, config }) => {
        const caller: t.VitePlugin = {
          name: 'fixture:pre-html-input',
          enforce: 'post',
          transformIndexHtml: {
            order: 'pre',
            handler: () => '<script type="module" src="../main.js" integrity="authored"></script>',
          },
        };
        await build({ ...config, plugins: [caller] });
        const control = await readBuiltHtml(root);
        expect(control).to.include('type="module"');
        expect(control).not.to.include('integrity=');

        const integrity = VitePlugins.HtmlIntegrity.plugin();
        const plugins = placement === 'before' ? [caller, integrity] : [integrity, caller];
        const reason = placement === 'before' ? 'authored input integrity' : 'pre HTML hook';
        await expectBuildRefusal({ ...config, plugins }, reason);
      });
    });
  }

  it('refuses custom HTML asset sources rather than silently dropping link metadata', async () => {
    await fixture(async ({ root, config }) => {
      await Fs.write(
        Fs.join(root, 'nested/index.html'),
        '<link data-css="../main.css" integrity="authored">',
      );
      const next: InlineConfig = {
        ...config,
        html: { additionalAssetSources: { link: { srcAttributes: ['data-css'] } } },
      };
      await build({ ...next, plugins: [] });
      const control = await readBuiltHtml(root);
      expect(control).to.include('rel="stylesheet"');
      expect(control).not.to.include('integrity=');

      await expectBuildRefusal(next, 'custom HTML asset sources');
    });
  });

  for (const unsupported of ['ssr', 'lib', 'renderBuiltUrl'] as const) {
    it(`refuses unsupported ${unsupported} output`, async () => {
      await fixture(async ({ root, config }) => {
        const next: t.ViteUserConfig = unsupported === 'renderBuiltUrl'
          ? { ...config, experimental: { renderBuiltUrl: (file) => file } }
          : {
            ...config,
            build: {
              ...config.build,
              ...(unsupported === 'ssr'
                ? { ssr: true }
                : { lib: { entry: Fs.join(root, 'main.js') } }),
            },
          };
        await expectBuildRefusal(next, 'unsupported');
      });
    });
  }
});

// Separate test boundaries expose background work escaping transform-only server shutdown.
// Repeating startup matters: a leaked operation may finish in the following test.
for (const count of [1, 2, 3, 4]) {
  Deno.test(`HTML integrity → transform-only development lifecycle ${count}`, async () => {
    await fixture(async ({ config }) => {
      const dev = await createServer(config);
      try {
        const html = await dev.transformIndexHtml('/nested/index.html', SOURCE);
        const integrityPlugin = dev.config.plugins.find((plugin) =>
          plugin.name === 'sys:html-integrity'
        );
        expect(html).not.to.include('integrity=');
        expect(integrityPlugin).to.eql(undefined);
      } finally {
        await dev.close();
      }
    });
  });
}

/** Each case owns an isolated Vite project and its cleanup. */
async function fixture(run: (value: Fixture) => Promise<void>) {
  const tmp = await Fs.makeTempDir({ prefix: 'vite.html-integrity.' });
  const root = tmp.absolute;
  try {
    await Fs.write(Fs.join(root, 'nested/index.html'), SOURCE);
    await Fs.write(
      Fs.join(root, 'main.js'),
      Str.dedent(`
      import './main.css';
      globalThis.loadLazy = () => import('./lazy.js');
      console.info('entry');
    `),
    );
    await Fs.write(Fs.join(root, 'main.css'), 'body { color: rgb(12, 34, 56); }');
    await Fs.write(
      Fs.join(root, 'lazy.js'),
      Str.dedent(`
      import './lazy.css';
      export const lazy = 'lazy';
    `),
    );
    await Fs.write(Fs.join(root, 'lazy.css'), 'body { background: white; }');
    await run({
      root,
      config: {
        root,
        configFile: false,
        base: './',
        logLevel: 'silent',
        plugins: [VitePlugins.HtmlIntegrity.plugin()],
        // Own CSS configuration: Vite's background discovery can outlive dev.close().
        css: { postcss: { plugins: [] } },
        build: { outDir: 'dist', rollupOptions: { input: Fs.join(root, 'nested/index.html') } },
      },
    });
  } finally {
    await Fs.remove(root);
  }
}

/** A missing HTML file is a fixture failure, never an empty successful build. */
async function readBuiltHtml(root: string): Promise<string> {
  const path = Fs.join(root, 'dist/nested/index.html');
  const { data } = await Fs.readText(path);
  if (!Is.str(data)) throw new Error(`fixture: missing written HTML ${path}`);
  return data;
}

/** Refusal must come from this plugin, not an unrelated Vite or fixture failure. */
async function expectBuildRefusal(config: InlineConfig, reason: string): Promise<void> {
  const { result } = await Try.run(() => build(config));
  if (result.ok) throw new Error(`expected integrity build refusal: ${reason}`);
  expect(result.error.message).to.include('[sys:html-integrity]');
  expect(result.error.message).to.include(reason);
}

/** Recompute from disk, independently of the plugin's parser and digest cache. */
async function expectWritten(root: string, base: string, count = 2) {
  const html = await readBuiltHtml(root);
  // Vite's controlled generated fixture uses double-quoted attributes, not arbitrary authored HTML.
  const tags = [...html.matchAll(/<(?:script|link)\b[^>]*>/g)];
  expect(tags.length).to.eql(count);
  for (const [tag] of tags) {
    const url = /(?:src|href)="([^"]+)"/.exec(tag)?.[1];
    if (!url) throw new Error(`fixture: missing resource URL in ${tag}`);
    const relative = base === './' || base === '' ? `nested/${url}` : url.slice(base.length);
    const path = Fs.resolve(root, 'dist', relative);
    const { data: bytes } = await Fs.read(path);
    if (!bytes) throw new Error(`fixture: missing written asset ${path}`);
    const expected = Hash.sha256(bytes, { encoding: 'base64' });
    expect(tag).to.include(`integrity="${expected}"`);
    expect(tag).to.match(/crossorigin(?:="anonymous")?(?:\s|>)/);
  }
}
