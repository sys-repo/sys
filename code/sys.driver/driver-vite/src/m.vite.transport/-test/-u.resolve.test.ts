import { describe, expect, Fs, it, Path } from '../../-test.ts';
import { Json, type t } from '../common.ts';
import {
  isDenoSpecifier,
  parseDenoSpecifier,
  repairConcreteRemoteAuthorityDelimiter,
  toDenoSpecifier,
} from '../u/u.specifier.ts';
import {
  createResolvePlugin,
  resolveNpmPathWith,
  resolveViteSpecifier,
} from '../u.resolve/u.resolve.ts';
import { procOutput } from './u.fixture.ts';

describe('ViteTransport.resolve', () => {
  type PluginResolve = NonNullable<t.Rollup.PluginContext['resolve']>;
  const pluginContext = {} as unknown as t.Rollup.PluginContext;
  const ENV_TRACE = 'SYS_VITE_TRACE_RESOLVE';

  describe('specifier encoding', () => {
    it('identifies deno-prefixed module ids', () => {
      expect(isDenoSpecifier('\0deno::TypeScript::id::/tmp/mod.ts')).to.eql(true);
      expect(isDenoSpecifier('/tmp/mod.ts')).to.eql(false);
    });

    it('round-trips encoded deno specifiers', () => {
      const spec = toDenoSpecifier('TypeScript', './mod.ts', '/tmp/dir/../mod.ts');
      const parsed = parseDenoSpecifier(spec);

      expect(parsed.loader).to.eql('TypeScript');
      expect(parsed.id).to.eql('./mod.ts');
      expect(parsed.resolved).to.eql(Path.normalize('/tmp/dir/../mod.ts'));
    });

    it('repairs malformed concrete remote authority delimiters narrowly', () => {
      expect(repairConcreteRemoteAuthorityDelimiter('https:/jsr.io/@std/path/mod.ts')).to.eql(
        'https://jsr.io/@std/path/mod.ts',
      );
      expect(repairConcreteRemoteAuthorityDelimiter('http:/example.com/mod.ts')).to.eql(
        'http://example.com/mod.ts',
      );
      expect(repairConcreteRemoteAuthorityDelimiter('https://jsr.io/@std/path/mod.ts')).to.eql(
        'https://jsr.io/@std/path/mod.ts',
      );
      expect(repairConcreteRemoteAuthorityDelimiter('jsr:@std/path')).to.eql('jsr:@std/path');
      expect(repairConcreteRemoteAuthorityDelimiter('./mod.ts')).to.eql('./mod.ts');
    });

    it('repairs malformed remote ids when encoding and parsing deno specifiers', () => {
      const spec = toDenoSpecifier(
        'TypeScript',
        'https:/jsr.io/@std/path/mod.ts',
        '/tmp/cache/mod.ts',
      );
      const parsed = parseDenoSpecifier(spec);

      expect(parsed.id).to.eql('https://jsr.io/@std/path/mod.ts');
      expect(spec).to.eql('\0deno::TypeScript::https://jsr.io/@std/path/mod.ts::/tmp/cache/mod.ts');
    });
  });

  describe('npm path fallback', () => {
    it('returns file paths from deno import-meta resolution', async () => {
      let invoked: t.Process.InvokeArgs | undefined;
      const res = await resolveNpmPathWith('react', '/tmp/project', {
        async invoke(input) {
          invoked = input;
          return procOutput({
            success: true,
            stdout: 'file:///tmp/project/node_modules/react/index.js\n',
          });
        },
      });

      expect(res).to.eql('/tmp/project/node_modules/react/index.js');
      expect(invoked?.cmd).to.eql(Deno.build.os === 'windows' ? 'deno.exe' : 'deno');
      expect(invoked?.args).to.eql([
        'eval',
        'console.log(import.meta.resolve(Deno.args[0]))',
        'react',
      ]);
      expect(invoked?.cwd).to.eql('/tmp/project');
      expect(invoked?.silent).to.eql(true);
    });

    it('returns null for non-file npm resolution output', async () => {
      const res = await resolveNpmPathWith('node:path', '/tmp/project', {
        async invoke() {
          return procOutput({ success: true, stdout: 'node:path\n' });
        },
      });

      expect(res).to.eql(null);
    });

    it('returns null when deno import-meta resolution fails', async () => {
      const res = await resolveNpmPathWith('react', '/tmp/project', {
        async invoke() {
          return procOutput({ success: false, stderr: 'not found' });
        },
      });

      expect(res).to.eql(null);
    });
  });

  describe('vite resolution', () => {
    it('requires resolved cacheDir when dev transport config is resolved', () => {
      const plugin = createResolvePlugin(new Map());
      expect(() =>
        plugin.configResolved?.call(pluginContext, { root: '/tmp/project', command: 'serve' })
      ).to.throw(
        'Expected resolved Vite cacheDir for dev transport cache.',
      );
    });

    describe('resolved module ids', () => {
      it('returns direct file ids for in-root esm modules', async () => {
        const root = '/tmp/project';
        const cache = new Map<string, t.DenoResolved>([
          [
            './dep.ts',
            {
              id: Path.join(root, 'src/dep.ts'),
              kind: 'esm',
              loader: 'TypeScript',
              dependencies: [],
            },
          ],
        ]);

        const res = await resolveViteSpecifier('./dep.ts', cache, root);
        expect(res).to.eql(Path.join(root, 'src/dep.ts'));
      });

      it('returns encoded deno ids for out-of-root esm modules', async () => {
        const root = '/tmp/project';
        const resolved = '/tmp/shared/dep.ts';
        const cache = new Map<string, t.DenoResolved>([
          [
            './dep.ts',
            {
              id: resolved,
              kind: 'esm',
              loader: 'TypeScript',
              dependencies: [],
            },
          ],
        ]);

        const res = await resolveViteSpecifier('./dep.ts', cache, root);
        expect(res).to.eql(toDenoSpecifier('TypeScript', './dep.ts', resolved));
      });

      it('returns null for npm-kind resolutions', async () => {
        const cache = new Map<string, t.DenoResolved>([
          [
            './dep.ts',
            {
              id: 'react@19.2.0',
              kind: 'npm',
              loader: null,
              dependencies: [],
            },
          ],
        ]);

        const res = await resolveViteSpecifier('./dep.ts', cache, '/tmp/project');
        expect(res).to.eql(null);
      });
    });

    describe('importer dependency graphs', () => {
      it('resolves file-url dependencies from deno importer cache', async () => {
        const fs = await Fs.makeTempDir({ prefix: 'ViteTransport.resolve.file-url.' });
        const child = Fs.join(fs.absolute, 'child.ts');
        await Fs.write(child, 'export const ok = true;');

        const parentResolved = '/tmp/cache/parent.ts';
        const importer = toDenoSpecifier('TypeScript', './parent.ts', parentResolved);
        const cache = new Map<string, t.DenoResolved>([
          [
            parentResolved,
            {
              id: parentResolved,
              kind: 'esm',
              loader: 'TypeScript',
              dependencies: [
                { specifier: './child.ts', resolvedSpecifier: Path.toFileUrl(child).href },
              ],
            },
          ],
        ]);

        const res = await resolveViteSpecifier('./child.ts', cache, fs.absolute, importer);
        expect(res).to.eql(child);

        await Fs.remove(fs.absolute);
      });

      it('matches raw dependency specifiers without canonical rewrite', async () => {
        const parentResolved = '/tmp/cache/std-path-join.ts';
        const childResolved = '/tmp/cache/std-internal-os.ts';
        const importer = toDenoSpecifier('TypeScript', 'jsr:@std/path/join', parentResolved);
        const cache = new Map<string, t.DenoResolved>([
          [
            parentResolved,
            {
              id: parentResolved,
              kind: 'esm',
              loader: 'TypeScript',
              dependencies: [
                {
                  specifier: 'jsr:@std/internal@^1.0.12/os',
                  resolvedSpecifier: 'jsr:@std/internal@^1.0.12/os',
                },
              ],
            },
          ],
          [
            'jsr:@std/internal@^1.0.12/os',
            { id: childResolved, kind: 'esm', loader: 'TypeScript', dependencies: [] },
          ],
        ]);

        const res = await resolveViteSpecifier(
          'jsr:@std/internal@^1.0.12/os',
          cache,
          '/tmp/project',
          importer,
          {
            async invoke() {
              throw new Error('invoke should not be called for cached dependency match');
            },
          },
        );

        expect(res).to.eql(
          toDenoSpecifier('TypeScript', 'jsr:@std/internal@^1.0.12/os', childResolved),
        );
      });

      it('converts cached npm dependency subpaths to vite package ids without deno info', async () => {
        const parentResolved = '/tmp/cache/hash-parent.ts';
        const importer = toDenoSpecifier(
          'TypeScript',
          'https://jsr.io/@sys/crypto/0.0.221/src/m.Hash/u.hash.ts',
          parentResolved,
        );
        const cache = new Map<string, t.DenoResolved>([
          [
            parentResolved,
            {
              id: parentResolved,
              kind: 'esm',
              loader: 'TypeScript',
              dependencies: [
                {
                  specifier: 'npm:@noble/hashes@2.0.1/legacy.js',
                  resolvedSpecifier: 'npm:@noble/hashes@2.0.1/legacy.js',
                },
              ],
            },
          ],
        ]);
        let invokeCalls = 0;

        const res = await resolveViteSpecifier(
          '@noble/hashes/legacy.js',
          cache,
          '/tmp/project',
          importer,
          {
            async invoke() {
              invokeCalls++;
              throw new Error('deno info should not be invoked for cached npm subpath matches');
            },
          },
        );

        expect(res).to.eql('@noble/hashes/legacy.js');
        expect(invokeCalls).to.eql(0);
      });

      it('falls through when vite cannot resolve delegated bare npm package ids', async () => {
        const parentResolved = '/tmp/cache/hash-parent.ts';
        const importer = toDenoSpecifier(
          'TypeScript',
          'https://jsr.io/@sys/crypto/0.0.221/src/m.Hash/u.hash.ts',
          parentResolved,
        );
        const cache = new Map<string, t.DenoResolved>([
          [
            parentResolved,
            {
              id: parentResolved,
              kind: 'esm',
              loader: 'TypeScript',
              dependencies: [
                {
                  specifier: '@noble/hashes/legacy.js',
                  resolvedSpecifier: 'npm:@noble/hashes@2.0.1/legacy.js',
                },
              ],
            },
          ],
        ]);
        const plugin = createResolvePlugin(cache, {
          async invoke(input: t.Process.InvokeArgs) {
            if (input.args[0] === '--version') {
              return procOutput({ success: true, stdout: 'deno 2.x' });
            }
            if (input.args[input.args.length - 1] === 'npm:@noble/hashes@2.0.1/legacy.js') {
              return procOutput({
                success: true,
                stdout: Json.stringify({
                  roots: ['npm:@noble/hashes@2.0.1/legacy.js'],
                  modules: [
                    {
                      kind: 'npm',
                      specifier: 'npm:/@noble/hashes@2.0.1/legacy.js',
                      npmPackage: '@noble/hashes@2.0.1',
                    },
                  ],
                  redirects: {
                    'npm:@noble/hashes@2.0.1/legacy.js': 'npm:/@noble/hashes@2.0.1/legacy.js',
                  },
                }),
              });
            }
            throw new Error(`Unexpected deno info lookup: ${input.args[input.args.length - 1]}`);
          },
          async resolveNpmPath() {
            return null;
          },
        });
        plugin.configResolved?.call(pluginContext, { root: '/tmp/project' });
        const context = {
          async resolve(
            id: string,
            _importer?: string,
            options?: Parameters<PluginResolve>[2],
          ): Promise<null> {
            expect(id).to.eql('@noble/hashes/legacy.js');
            expect(_importer).to.eql('/tmp/project/deno.json');
            expect(options?.skipSelf).to.eql(true);
            return null;
          },
        } as unknown as t.Rollup.PluginContext;

        const res = await plugin.resolveId.call(context, '@noble/hashes/legacy.js', importer);

        expect(res).to.eql(null);
      });

      it('delegates bare npm package ids back into vite resolution', async () => {
        const parentResolved = '/tmp/cache/hash-parent.ts';
        const importer = toDenoSpecifier(
          'TypeScript',
          'https://jsr.io/@sys/crypto/0.0.221/src/m.Hash/u.hash.ts',
          parentResolved,
        );
        const cache = new Map<string, t.DenoResolved>([
          [
            parentResolved,
            {
              id: parentResolved,
              kind: 'esm',
              loader: 'TypeScript',
              dependencies: [
                {
                  specifier: '@noble/hashes/legacy.js',
                  resolvedSpecifier: 'npm:@noble/hashes@2.0.1/legacy.js',
                },
              ],
            },
          ],
        ]);
        const plugin = createResolvePlugin(cache, {
          async invoke(input: t.Process.InvokeArgs) {
            if (input.args[0] === '--version') {
              return procOutput({ success: true, stdout: 'deno 2.x' });
            }
            if (input.args[input.args.length - 1] === 'npm:@noble/hashes@2.0.1/legacy.js') {
              return procOutput({
                success: true,
                stdout: Json.stringify({
                  roots: ['npm:@noble/hashes@2.0.1/legacy.js'],
                  modules: [
                    {
                      kind: 'npm',
                      specifier: 'npm:/@noble/hashes@2.0.1/legacy.js',
                      npmPackage: '@noble/hashes@2.0.1',
                    },
                  ],
                  redirects: {
                    'npm:@noble/hashes@2.0.1/legacy.js': 'npm:/@noble/hashes@2.0.1/legacy.js',
                  },
                }),
              });
            }
            throw new Error(`Unexpected deno info lookup: ${input.args[input.args.length - 1]}`);
          },
          async resolveNpmPath() {
            return null;
          },
        });
        plugin.configResolved?.call(pluginContext, { root: '/tmp/project' });
        const context = {
          async resolve(
            id: string,
            _importer?: string,
            options?: Parameters<PluginResolve>[2],
          ): Promise<t.Rollup.ResolvedId> {
            expect(id).to.eql('@noble/hashes/legacy.js');
            expect(_importer).to.eql('/tmp/project/deno.json');
            expect(options?.skipSelf).to.eql(true);
            return {
              id: '/tmp/node_modules/@noble/hashes/legacy.js',
              external: false,
              meta: {},
              moduleSideEffects: true,
            };
          },
        } as unknown as t.Rollup.PluginContext;

        const res = await plugin.resolveId.call(context, '@noble/hashes/legacy.js', importer);

        expect(res).to.eql({
          id: '/tmp/node_modules/@noble/hashes/legacy.js',
          external: false,
          meta: {},
          moduleSideEffects: true,
        });
      });

      it('falls back to a deno-resolved npm file path for remote bare package ids', async () => {
        const parentResolved = '/tmp/cache/useRubberband.ts';
        const importer = toDenoSpecifier(
          'TypeScript',
          'https://jsr.io/@sys/ui-react-devharness/0.0.252/src/ui.use/use.Rubberband.ts',
          parentResolved,
        );
        const cache = new Map<string, t.DenoResolved>([
          [
            parentResolved,
            {
              id: parentResolved,
              kind: 'esm',
              loader: 'TypeScript',
              dependencies: [
                {
                  specifier: 'react',
                  resolvedSpecifier: 'npm:react@19.2.4',
                },
              ],
            },
          ],
        ]);
        const plugin = createResolvePlugin(cache, {
          async invoke(input: t.Process.InvokeArgs) {
            if (input.args[0] === '--version') {
              return procOutput({ success: true, stdout: 'deno 2.x' });
            }
            if (input.args[input.args.length - 1] === 'npm:react@19.2.4') {
              return procOutput({
                success: true,
                stdout: Json.stringify({
                  roots: ['npm:react@19.2.4'],
                  modules: [
                    {
                      kind: 'npm',
                      specifier: 'npm:/react@19.2.4',
                      npmPackage: 'react@19.2.4',
                    },
                  ],
                  redirects: {
                    'npm:react@19.2.4': 'npm:/react@19.2.4',
                  },
                }),
              });
            }
            throw new Error(`Unexpected deno info lookup: ${input.args[input.args.length - 1]}`);
          },
          async resolveNpmPath(id: string, cwd: string) {
            expect(id).to.eql('react');
            expect(cwd).to.eql('/tmp/project');
            return '/tmp/project/node_modules/.deno/react@19.2.4/node_modules/react/index.js';
          },
        });
        plugin.configResolved?.call(pluginContext, { root: '/tmp/project' });
        const context = {
          async resolve(
            id: string,
            _importer?: string,
            options?: Parameters<PluginResolve>[2],
          ): Promise<null> {
            expect(id).to.eql('react');
            expect(_importer).to.eql('/tmp/project/deno.json');
            expect(options?.skipSelf).to.eql(true);
            return null;
          },
        } as unknown as t.Rollup.PluginContext;

        const res = await plugin.resolveId.call(context, 'react', importer);

        expect(res).to.eql(
          '/tmp/project/node_modules/.deno/react@19.2.4/node_modules/react/index.js',
        );
      });
    });
  });
});
