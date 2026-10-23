import { c, DenoFile, describe, expect, Fs, Is, it, Json, Path, type t } from '../../-test.ts';
import { ViteConfig } from '../mod.ts';
import { HtmlIntegrity } from '../../m.vite.plugins/m.HtmlIntegrity/mod.ts';
import { BROWSER_SYNTAX_TARGETS } from '../u/u.browserSyntaxTargets.ts';
import { adaptLoaderResolution } from '../../m.vite.transport/u.resolve/u.loaderAdapter.ts';

describe('Config.Build', () => {
  const { brightCyan: cyan } = c;

  describe('app (application)', () => {
    const includesPlugin = (config: t.ViteUserConfig, name: string) => {
      const plugins = (config.plugins ?? []).flat() as t.VitePlugin[];
      return plugins.some((p) => p.name.toLowerCase().includes(name));
    };

    const resolveAlias = async (cwd: string, workspace: string, find: string) => {
      const config = await ViteConfig.app({
        paths: ViteConfig.paths({ cwd }),
        workspace,
        plugins: { optimizeImports: false },
      });
      const aliases = (config.resolve?.alias ?? []) as t.ViteAlias[];
      return aliases.find((item) => item.find === find)?.replacement;
    };

    const print = (config: t.ViteUserConfig, titleSuffix?: string, paths?: t.ViteConfig.Paths) => {
      if (paths) {
        console.info();
        console.info(cyan(c.bold('↓ INPUT paths')));
        console.info(paths);
        console.info();
      }

      console.info();
      console.info(cyan(c.bold('↓ ViteConfig.app')), c.gray(titleSuffix ?? ''));
      console.info({
        ...config,
        plugins: ((config.plugins ?? []) as t.VitePlugin[]).flat().map((m) => m.name),
        resolve: {
          ...config.resolve,
          alias: `← 🌳 ${config.resolve?.alias?.length} aliases (across workspace)`,
        },
      });
      console.info();
      return config;
    };

    it('defaults', async () => {
      const p = ViteConfig.paths();
      const config = await ViteConfig.app();
      print(config, '(defaults)', p);

      const input = config.build?.rollupOptions?.input;
      if (!Is.record(input)) throw new Error('Expected named build inputs');

      expect(config.root).to.eql(p.cwd);
      expect(config.envDir).to.eql(p.cwd);
      const workspaceRoot = Path.dirname((await DenoFile.workspace()).file);
      expect(config.cacheDir).to.eql(Fs.join(p.cwd, 'node_modules', '.vite'));
      expect(config.server?.fs?.allow).to.eql([Path.resolve(p.cwd), workspaceRoot]);
      expect(config.build?.outDir).to.eql(Fs.join(p.cwd, p.app.outDir));
      expect(input).to.eql({ main: Fs.join(p.cwd, p.app.entry) });
      expect(config.optimizeDeps).to.eql(undefined);
      expect(config.build?.target).to.eql([...BROWSER_SYNTAX_TARGETS]);
      expect(config.oxc).to.eql({ target: [...BROWSER_SYNTAX_TARGETS] });
      expect(config.build?.target).not.to.equal(config.oxc && config.oxc.target);

      expect(includesPlugin(config, 'wasm')).to.be.true;
      expect(includesPlugin(config, 'react')).to.be.true;
      expect(includesPlugin(config, 'sys:specifier-rewrite')).to.be.true;
      expect(includesPlugin(config, 'sys:dispose-protocol-compat')).to.be.true;
      expect(includesPlugin(config, 'sys:oxc-preflight')).to.be.true;
      expect(includesPlugin(config, 'sys:html-integrity')).to.be.true;
    });

    it('no common plugins', async () => {
      const config = await ViteConfig.app({ plugins: { wasm: false, react: false, deno: false } });
      const names = ((config.plugins ?? []) as t.VitePlugin[]).flat().map((m) => m.name);

      expect(names).to.eql([
        'sys:fs-root-identity',
        'sys:dispose-protocol-compat',
        'sys:optimize-imports',
        'sys:html-integrity',
        'sys:oxc-preflight',
      ]);
    });

    it('creates fresh worker plugin instances with disposal compatibility enabled', async () => {
      const config = await ViteConfig.app();
      const createWorkerPlugins = config.worker?.plugins;
      if (!createWorkerPlugins) throw new Error('Expected worker plugin factory');

      const first = createWorkerPlugins().flat() as t.VitePlugin[];
      const second = createWorkerPlugins().flat() as t.VitePlugin[];
      const firstCompat = first.find((plugin) => plugin.name === 'sys:dispose-protocol-compat');
      const secondCompat = second.find((plugin) => plugin.name === 'sys:dispose-protocol-compat');
      const firstDeno = first.find((plugin) => plugin.name === 'deno');
      const secondDeno = second.find((plugin) => plugin.name === 'deno');

      expect(first).not.to.equal(second);
      expect(firstCompat?.name).to.eql('sys:dispose-protocol-compat');
      expect(secondCompat?.name).to.eql('sys:dispose-protocol-compat');
      expect(firstCompat).not.to.equal(secondCompat);
      expect(firstDeno).not.to.equal(secondDeno);
      expect(first.some((plugin) => plugin.name === 'sys:html-integrity')).to.eql(false);
      expect(second.some((plugin) => plugin.name === 'sys:html-integrity')).to.eql(false);
    });

    it('appends caller-supplied vite plugins after the driver/common plugin set', async () => {
      const customA: t.VitePlugin = { name: 'custom:a' };
      const customB: t.VitePlugin = { name: 'custom:b' };
      const config = await ViteConfig.app({ vitePlugins: [customA, customB] });
      const names = ((config.plugins ?? []) as t.VitePlugin[]).flat().map((m) => m.name);

      const specifierRewrite = names.indexOf('sys:specifier-rewrite');
      const customAIndex = names.indexOf('custom:a');
      const customBIndex = names.indexOf('custom:b');
      const reactIndex = names.findIndex((name) => name.includes('react'));

      expect(customAIndex > -1).to.eql(true);
      expect(customBIndex > -1).to.eql(true);
      expect(specifierRewrite > -1).to.eql(true);
      expect(reactIndex > -1).to.eql(true);
      expect(customAIndex > specifierRewrite).to.eql(true);
      expect(customAIndex > reactIndex).to.eql(true);
      expect(customBIndex > customAIndex).to.eql(true);
    });

    it('keeps visualizer last after caller-supplied vite plugins', async () => {
      const custom: t.VitePlugin = { name: 'custom:a' };
      const config = await ViteConfig.app({
        vitePlugins: [custom],
        visualizer: true,
      });
      const names = ((config.plugins ?? []) as t.VitePlugin[]).flat().map((m) => m.name);

      expect(names.at(-4)).to.eql('custom:a');
      expect(names.at(-3)).to.eql('sys:html-integrity');
      expect(names.at(-2)).to.eql('sys:oxc-preflight');
      expect(names.at(-1)).to.eql('visualizer');
    });

    const integrityCases = [
      { htmlIntegrity: undefined, expected: ['sys:html-integrity'] },
      { htmlIntegrity: false, expected: [] },
      { htmlIntegrity: true, expected: ['sys:html-integrity'] },
    ] as const;
    for (const { htmlIntegrity, expected } of integrityCases) {
      it(`HTML integrity ${htmlIntegrity} → app-only, ordered, default-on`, async () => {
        const config = await ViteConfig.app({
          workspace: false,
          plugins: { deno: false, react: false, wasm: false, htmlIntegrity },
          vitePlugins: [{ name: 'caller:post', enforce: 'post' }],
          visualizer: true,
        });
        const names = (config.plugins as t.VitePlugin[]).map((plugin) => plugin.name);
        expect(names).to.eql([
          'sys:fs-root-identity',
          'sys:dispose-protocol-compat',
          'sys:optimize-imports',
          'caller:post',
          ...expected,
          'sys:oxc-preflight',
          'visualizer',
        ]);
        const workers = config.worker?.plugins?.().flat() as t.VitePlugin[];
        expect(workers.map((plugin) => plugin.name)).to.eql([
          'sys:dispose-protocol-compat',
          'sys:optimize-imports',
        ]);
      });
    }

    const pluginCases = [
      { name: 'omitted', plugins: undefined },
      { name: 'empty', plugins: {} },
      { name: 'partial', plugins: { react: false } },
    ];
    for (const { name, plugins } of pluginCases) {
      it(`plugin options ${name} → inherit integrity and other defaults`, async () => {
        const config = await ViteConfig.app({ workspace: false, plugins });
        const entries = (config.plugins as t.VitePlugin[]).filter((plugin) =>
          plugin.name === 'sys:html-integrity'
        );
        expect(entries.length).to.eql(1);
        expect(includesPlugin(config, 'react')).to.eql(plugins?.react ?? true);
        expect(includesPlugin(config, 'wasm')).to.eql(true);
      });
    }

    it('HTML integrity false → preserves a caller factory instance', async () => {
      const explicit = HtmlIntegrity.plugin();
      const config = await ViteConfig.app({
        workspace: false,
        plugins: { deno: false, react: false, wasm: false, htmlIntegrity: false },
        vitePlugins: [explicit],
      });
      const plugins = config.plugins as t.VitePlugin[];
      expect(plugins.filter((plugin) => plugin.name === explicit.name)).to.eql([explicit]);
      expect(plugins.includes(explicit)).to.eql(true);
    });

    it('supports app config without a workspace', async () => {
      const config = await ViteConfig.app({ workspace: false });

      expect(config.resolve?.alias).to.eql([]);
      expect(includesPlugin(config, 'sys:specifier-rewrite')).to.eql(true);
      expect(includesPlugin(config, 'sys:npm-prewarm')).to.eql(false);
    });

    it('does not mount npm prewarm when local deno.json uses manual node-modules mode', async () => {
      const fs = await Fs.makeTempDir({ prefix: 'ViteConfig.app.manual-node-modules.' });
      try {
        await Fs.write(
          Fs.join(fs.absolute, 'deno.json'),
          Json.stringify({
            name: '@tmp/manual',
            version: '0.0.0',
            nodeModulesDir: 'manual',
            importMap: 'imports.json',
          }, 2),
        );
        await Fs.write(Fs.join(fs.absolute, 'imports.json'), Json.stringify({ imports: {} }, 2));

        const paths = ViteConfig.paths({ cwd: fs.absolute });
        const config = await ViteConfig.app({ workspace: false, paths });

        expect(config.resolve?.alias).to.eql([]);
        expect(config.server?.fs?.allow).to.eql([Path.resolve(await Fs.realPath(fs.absolute))]);
        expect(includesPlugin(config, 'sys:specifier-rewrite')).to.eql(true);
        expect(includesPlugin(config, 'sys:npm-prewarm')).to.eql(false);
      } finally {
        await Fs.remove(fs.absolute);
      }
    });

    it('symlinked app/workspace roots → one canonical directory, no parent grants', async () => {
      const fs = await Fs.makeTempDir({ prefix: 'ViteConfig.app.root-identity.' });
      try {
        const real = Fs.join(fs.absolute, 'app');
        const linked = Fs.join(fs.absolute, 'app-link');
        await Fs.ensureDir(real);
        await Fs.writeJson(Fs.join(real, 'deno.json'), { workspace: [] });
        await Fs.ensureSymlink(real, linked);
        const config = await ViteConfig.app({
          paths: ViteConfig.paths({ cwd: linked }),
          workspace: Fs.join(real, 'deno.json'),
          plugins: { deno: false, react: false, wasm: false, optimizeImports: false },
        });

        expect(config.server?.fs?.allow).to.eql([Path.resolve(await Fs.realPath(real))]);
        expect(config.server?.fs?.strict).not.to.eql(false);
      } finally {
        await Fs.remove(fs.absolute);
      }
    });

    it('does not mount deno plugins when no local deno.json exists', async () => {
      const fs = await Fs.makeTempDir({ prefix: 'ViteConfig.app.no-deno.' });
      try {
        const paths = ViteConfig.paths({ cwd: fs.absolute });
        const config = await ViteConfig.app({ workspace: false, paths });

        expect(config.resolve?.alias).to.eql([]);
        expect(includesPlugin(config, 'sys:specifier-rewrite')).to.eql(false);
        expect(includesPlugin(config, 'sys:npm-prewarm')).to.eql(false);
      } finally {
        await Fs.remove(fs.absolute);
      }
    });

    it('custom paths', async () => {
      const paths = ViteConfig.paths({
        cwd: ' /foo/ ', // NB: absolute path (trimmed internally).
        app: {
          entry: 'src/-foo.html',
          outDir: 'foobar/out',
          sw: 'src/sw.ts', // NB: service-worker.
        },
      });
      const config = await ViteConfig.app({ paths });
      print(config, '(custom paths)', paths);

      expect(config.root).to.eql('/foo/src');
      expect(config.cacheDir).to.eql(Fs.join(paths.cwd, 'node_modules', '.vite'));
      expect(config.build?.outDir).to.eql(Fs.join(paths.cwd, 'foobar/out'));

      const input = config.build?.rollupOptions?.input;
      if (!Is.record(input)) throw new Error('Expected named build inputs');
      expect(input).to.eql({
        main: Fs.join(paths.cwd, 'src/-foo.html'),
        sw: Fs.join(paths.cwd, 'src/sw.ts'),
      });
      expect(config.envDir).to.eql(paths.cwd);
    });

    it('keeps env loading rooted at package cwd when app root is nested', async () => {
      const paths = ViteConfig.paths({
        cwd: '/pkg',
        app: { entry: 'src/index.html' },
      });
      const config = await ViteConfig.app({ paths });

      expect(config.root).to.eql('/pkg/src');
      expect(config.envDir).to.eql('/pkg');
      expect(config.cacheDir).to.eql('/pkg/node_modules/.vite');
      expect(config.server?.fs?.allow).to.include('/pkg');
    });

    it('passes optimizeDeps and explicit OXC options through', async () => {
      const optimizeDeps: NonNullable<t.ViteUserConfig['optimizeDeps']> = {
        include: ['react', 'react-dom/client'],
        exclude: ['@acme/skip'],
        entries: ['src/-test/index.html'],
      };
      const oxc: NonNullable<t.ViteUserConfig['oxc']> = {
        include: /\.tsx$/,
        target: ['safari18'],
      };
      const config = await ViteConfig.app({ optimizeDeps, oxc });

      expect(config.optimizeDeps).to.eql(optimizeDeps);
      expect(config.oxc).to.eql(oxc);
      expect(config.oxc).not.to.equal(oxc);
    });

    it('preserves explicit OXC disablement', async () => {
      const config = await ViteConfig.app({ oxc: false });
      expect(config.oxc).to.eql(false);
    });

    it('resolves default workspace authority from app cwd', async () => {
      const fs = await fixture.aliasWorld('ViteConfig.app.workspace.cwd.', {});
      try {
        const paths = ViteConfig.paths({ cwd: fs.appDir });
        const config = await ViteConfig.app({
          paths,
          plugins: { optimizeImports: false },
        });
        const aliases = (config.resolve?.alias ?? []) as t.ViteAlias[];
        const lib = aliases.find((item) => item.find === '@tmp/lib/mod');

        expect(lib?.replacement).to.eql(Path.join(fs.root, 'code', 'lib', 'src', 'mod.ts'));
      } finally {
        await Fs.remove(fs.root);
      }
    });

    it('adds a package-level alias for react-inspector to the dominant workspace authority', async () => {
      const fs = await fixture.aliasWorld('ViteConfig.app.alias.direct.', { direct: true });
      try {
        const actual = await resolveAlias(fs.appDir, fs.workspaceFile, 'react-inspector');
        expect(actual).to.eql(fs.authorityPackageDir);
      } finally {
        await Fs.remove(fs.root);
      }
    });

    it('extends the react-inspector authority alias to transitive workspace consumers', async () => {
      const fs = await fixture.aliasWorld('ViteConfig.app.alias.transitive.', { transitive: true });
      try {
        const actual = await resolveAlias(fs.appDir, fs.workspaceFile, 'react-inspector');
        expect(actual).to.eql(fs.authorityPackageDir);
      } finally {
        await Fs.remove(fs.root);
      }
    });

    it('adapts chunk aliases to a first-match manualChunks function', async () => {
      const config = await ViteConfig.app({
        chunks(e) {
          e.chunk('react', ['react', '/exact/id?raw']);
          e.chunk('react.dom', ['react', 'react-dom']);
          e.chunk('replaced', 'lodash');
          e.chunk('replaced', 'yaml');
        },
      });

      const manualChunks = config.build?.rollupOptions?.output as t.Rollup.OutputOptions;
      const chunk = manualChunks.manualChunks as undefined | ((id: string) => string | undefined);

      const react = '/tmp/node_modules/.deno/react@19.2.5/node_modules/react/index.js';
      const reactDom = '/tmp/node_modules/.deno/react-dom@19.2.5/node_modules/react-dom/client.js';
      expect(Is.func(chunk)).to.eql(true);
      expect(chunk?.(react)).to.eql('react');
      expect(chunk?.(reactDom)).to.eql('react.dom');
      expect(chunk?.('/exact/id?raw')).to.eql('react');
      expect(chunk?.('/exact/id')).to.eql(undefined);
      expect(chunk?.('/tmp/node_modules/lodash/map.js')).to.eql(undefined);
      expect(chunk?.('/tmp/node_modules/yaml/browser.js')).to.eql('replaced');
    });

    it('leaves manualChunks undefined when no chunks are declared', async () => {
      const config = await ViteConfig.app({ chunks() {} });
      const output = config.build?.rollupOptions?.output as t.Rollup.OutputOptions;
      expect(output.manualChunks).to.eql(undefined);
    });

    it('workspace chunks → symlink realpaths and transport-produced local identities', async () => {
      const fs = await fixture.aliasWorld('ViteConfig.app.chunks.identity.', { symlink: true });
      try {
        const config = await ViteConfig.app({
          paths: ViteConfig.paths({ cwd: fs.appDir }),
          workspace: fs.workspaceFile,
          plugins: { optimizeImports: false },
          chunks(e) {
            e.chunk('root', '@tmp/lib');
            e.chunk('mod', '@tmp/lib/mod');
          },
        });
        const output = config.build?.rollupOptions?.output as t.Rollup.OutputOptions;
        const chunk = output.manualChunks as (id: string) => string | undefined;
        const logical = Path.join(fs.libDir, 'src', 'mod.ts');
        const physical = await Fs.realPath(logical);
        expect(logical).not.to.eql(physical);
        expect(chunk(logical)).to.eql('mod');
        expect(chunk(physical)).to.eql('mod');
        expect(chunk(physical.replaceAll('/', '\\'))).to.eql('mod');

        for (const target of [logical, physical]) {
          const fileUrl = Path.toFileUrl(target).href;
          const requests = ['@tmp/lib/mod', '../lib/src/mod.ts', target, fileUrl];
          for (const request of requests) {
            const id = adaptLoaderResolution(request, fileUrl, new Map(), fs.appDir);
            if (!Is.str(id)) throw new Error('Expected a local transport identity');
            expect(id.startsWith('\0deno::')).to.eql(true);
            expect(chunk(id), request).to.eql('mod');
            expect(chunk(`/@id/${id.replace('\0', '__x00__')}`), request).to.eql('mod');
          }
        }
        expect(chunk(`${physical}?raw`)).to.eql(undefined);
        expect(chunk(Path.join(Path.dirname(physical), 'private.ts'))).to.eql(undefined);
      } finally {
        await Fs.remove(fs.root);
      }
    });

    it('workspace chunks → malformed, remote and queried wrappers do not match or throw', async () => {
      const fs = await fixture.aliasWorld('ViteConfig.app.chunks.admission.', {});
      try {
        const config = await ViteConfig.app({
          paths: ViteConfig.paths({ cwd: fs.appDir }),
          workspace: fs.workspaceFile,
          plugins: { optimizeImports: false },
          chunks: (e) => e.chunk('mod', '@tmp/lib/mod'),
        });
        const output = config.build?.rollupOptions?.output as t.Rollup.OutputOptions;
        const chunk = output.manualChunks as (id: string) => string | undefined;
        const target = Path.join(fs.libDir, 'src', 'mod.ts');
        const invalid = [
          '\0deno',
          '\0deno::',
          '\0deno::TypeScript',
          '\0deno::TypeScript::@tmp/lib/mod',
          `\0deno::TypeScript::@tmp/lib/mod::${target}::extra`,
          `\0deno::Unknown::@tmp/lib/mod::${target}`,
          `\0deno::::@tmp/lib/mod::${target}`,
          `\0deno::TypeScript::::${target}`,
          '\0deno::TypeScript::@tmp/lib/mod::',
          `\0other::TypeScript::@tmp/lib/mod::${target}`,
          `\0deno::TypeScript::https://example.com/mod.ts::${target}`,
          `\0deno::TypeScript::https:/example.com/mod.ts::${target}`,
          `\0deno::TypeScript::jsr:@tmp/lib/mod::${target}`,
          `\0deno::TypeScript::npm:@tmp/lib/mod::${target}`,
          '\0deno::TypeScript::@tmp/lib/mod::https://example.com/mod.ts',
          `\0deno::TypeScript::@tmp/lib/mod?raw::${target}`,
          `\0deno::TypeScript::@tmp/lib/mod::${target}?raw`,
          `\0deno::TypeScript::@tmp/lib/mod::${target}#fragment`,
          `\0deno::TypeScript::@tmp/lib/mod::${target}?/../mod.ts`,
        ];
        for (const id of invalid) {
          const label = Json.stringify(id);
          expect(chunk(id), label).to.eql(undefined);
          expect(chunk(`/@id/${id.replace('\0', '__x00__')}`), label).to.eql(undefined);
        }
      } finally {
        await Fs.remove(fs.root);
      }
    });

    it('workspace chunks → preserve integer-key precedence, replacement and absent targets', async () => {
      const fs = await fixture.aliasWorld('ViteConfig.app.chunks.precedence.', {});
      try {
        const config = await ViteConfig.app({
          paths: ViteConfig.paths({ cwd: fs.appDir }),
          workspace: fs.workspaceFile,
          plugins: { optimizeImports: false },
          chunks(e) {
            e.chunk('later', '@tmp/lib/mod');
            e.chunk('10', '@tmp/lib/mod');
            e.chunk('2', '@tmp/lib/mod');
            e.chunk('root', '@tmp/lib');
            e.chunk('root', '@tmp/absent');
          },
        });
        const output = config.build?.rollupOptions?.output as t.Rollup.OutputOptions;
        const chunk = output.manualChunks as (id: string) => string | undefined;
        expect(chunk(Path.join(fs.libDir, 'src', 'mod.ts'))).to.eql('2');
        expect(chunk(Path.join(fs.libDir, 'src', 'index.ts'))).to.eql(undefined);
        expect(chunk(Path.join(fs.libDir, 'src', 'mod.tsx'))).to.eql(undefined);
      } finally {
        await Fs.remove(fs.root);
      }
    });

    it('resolves exact workspace export targets without capturing sibling exports', async () => {
      const fs = await fixture.aliasWorld('ViteConfig.app.chunks.workspace.', {});
      try {
        const config = await ViteConfig.app({
          paths: ViteConfig.paths({ cwd: fs.appDir }),
          workspace: fs.workspaceFile,
          plugins: { optimizeImports: false },
          chunks(e) {
            e.chunk('lib.root', '@tmp/lib');
            e.chunk('lib.mod', '@tmp/lib/mod');
          },
        });
        const output = config.build?.rollupOptions?.output as t.Rollup.OutputOptions;
        const chunk = output.manualChunks as undefined | ((id: string) => string | undefined);
        const root = Path.join(fs.libDir, 'src', 'index.ts');
        const mod = Path.join(fs.libDir, 'src', 'mod.ts');

        expect(chunk?.(root)).to.eql('lib.root');
        expect(chunk?.(mod)).to.eql('lib.mod');
        expect(chunk?.(`\0deno::TypeScript::@tmp/lib::${root}`)).to.eql('lib.root');
        expect(chunk?.(`/@id/__x00__deno::TypeScript::@tmp/lib/mod::${mod}`)).to.eql('lib.mod');
        expect(chunk?.(Path.join(fs.libDir, 'src', 'private.ts'))).to.eql(undefined);
        expect(chunk?.(`${mod}?raw`)).to.eql(undefined);
        // Resolution is authoritative, not the request's original spelling.
        expect(chunk?.(`\0deno::TypeScript::@tmp/lib/mod::${root}`)).to.eql('lib.root');
        const remote = '\0deno::TypeScript::@tmp/lib/mod::https://example.com/mod.ts';
        expect(chunk?.(remote)).to.eql(undefined);
        expect(chunk?.('\0deno-unrelated')).to.eql(undefined);

        const filtered = await ViteConfig.app({
          paths: ViteConfig.paths({ cwd: fs.appDir }),
          workspace: fs.workspaceFile,
          filter: (e) => e.subpath.includes('/mod'),
          plugins: { optimizeImports: false },
          chunks(e) {
            e.chunk('lib.root', '@tmp/lib');
            e.chunk('lib.mod', '@tmp/lib/mod');
          },
        });
        const filteredOutput = filtered.build?.rollupOptions?.output as t.Rollup.OutputOptions;
        const filteredChunk = filteredOutput.manualChunks as (id: string) => string | undefined;
        expect(filteredChunk(root)).to.eql(undefined);
        expect(filteredChunk(mod)).to.eql('lib.mod');

        const disabled = await ViteConfig.app({
          paths: ViteConfig.paths({ cwd: fs.appDir }),
          workspace: false,
          plugins: { optimizeImports: false },
          chunks(e) {
            e.chunk('lib.root', '@tmp/lib');
          },
        });
        const disabledOutput = disabled.build?.rollupOptions?.output as t.Rollup.OutputOptions;
        const disabledChunk = disabledOutput.manualChunks as (id: string) => string | undefined;
        expect(disabledChunk(root)).to.eql(undefined);
      } finally {
        await Fs.remove(fs.root);
      }
    });
  });
});

const fixture = {
  async aliasWorld(
    prefix: string,
    options: { direct?: boolean; transitive?: boolean; symlink?: boolean },
  ) {
    const fs = await Fs.makeTempDir({ prefix });
    const root = await Fs.realPath(fs.absolute);
    const workspaceFile = Path.join(root, 'deno.json');
    const authorityPackageDir = Path.join(root, 'node_modules', 'react-inspector');
    const appDir = Path.join(root, 'code', 'app');
    const libDir = Path.join(root, 'code', 'lib');

    await fixture.packageJson(Path.join(root, 'package.json'), {
      name: '@tmp/root',
      version: '0.0.0',
      private: true,
    });
    await Fs.writeJson(workspaceFile, {
      name: '@tmp/workspace',
      version: '0.0.0',
      workspace: ['./code/app', './code/lib'],
    });

    await fixture.workspaceMember(appDir, '@tmp/app');
    const memberDir = options.symlink ? Path.join(root, 'physical', 'lib') : libDir;
    await fixture.workspaceMember(memberDir, '@tmp/lib');
    if (options.symlink) await Fs.ensureSymlink(memberDir, libDir);
    await fixture.reactLinkedPackage(authorityPackageDir, '0.0.0-fixture');

    if (options.direct) {
      await fixture.reactLinkedPackage(
        Path.join(appDir, 'node_modules', 'react-inspector'),
        '0.0.0-fixture',
      );
    }

    if (options.transitive) {
      await fixture.reactLinkedPackage(
        Path.join(libDir, 'node_modules', 'react-inspector'),
        '0.0.0-fixture',
      );
    }

    return { root, workspaceFile, authorityPackageDir, appDir, libDir } as const;
  },

  async workspaceMember(dir: string, name: string) {
    await Fs.ensureDir(Path.join(dir, 'src'));
    await Fs.write(Path.join(dir, 'src', 'index.ts'), 'export const root = true;\n');
    await Fs.write(Path.join(dir, 'src', 'mod.ts'), 'export const ok = true;\n');
    await Fs.write(Path.join(dir, 'src', 'private.ts'), 'export const internal = true;\n');
    await Fs.writeJson(Path.join(dir, 'deno.json'), {
      name,
      version: '0.0.0',
      exports: { '.': './src/index.ts', './mod': './src/mod.ts' },
    });
  },

  async reactLinkedPackage(dir: string, version: string) {
    await fixture.packageJson(Path.join(dir, 'package.json'), {
      name: 'react-inspector',
      version,
      peerDependencies: {
        react: '^19.0.0',
      },
    });
  },

  async packageJson(path: string, data: Record<string, unknown>) {
    await Fs.ensureDir(Path.dirname(path));
    await Fs.write(path, Json.stringify(data, 2));
  },
} as const;
