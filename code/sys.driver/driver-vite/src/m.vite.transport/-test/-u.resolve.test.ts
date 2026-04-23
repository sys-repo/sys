import { describe, expect, Fs, it, Path } from '../../-test.ts';
import { type t } from '../common.ts';
import { isDenoSpecifier, parseDenoSpecifier, toDenoSpecifier } from '../u.specifier.ts';
import {
  createResolvePlugin,
  resolveDenoWith,
  resolveViteSpecifier,
} from '../u.resolve.ts';
import { procOutput } from './u.fixture.ts';

describe('ViteTransport.resolve', () => {
  type PluginResolve = NonNullable<t.Rollup.PluginContext['resolve']>;
  const pluginContext = {} as unknown as t.Rollup.PluginContext;

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
  });

  describe('deno resolution', () => {
    it('returns null for unresolved deno info lookups', async () => {
      const res = await resolveDenoWith('./missing.ts', '/tmp', {
        async invoke(input: t.Process.InvokeArgs) {
          if (input.args[0] === '--version') {
            return procOutput({ success: true, stdout: 'deno 2.x' });
          }
          return procOutput({ success: false, stderr: 'Module not found' });
        },
      });

      expect(res).to.eql(null);
    });

    it('throws for integrity-check failures', async () => {
      try {
        await resolveDenoWith('./bad.ts', '/tmp', {
          async invoke(input: t.Process.InvokeArgs) {
            if (input.args[0] === '--version') {
              return procOutput({ success: true, stdout: 'deno 2.x' });
            }
            return procOutput({ success: false, stderr: 'Integrity check failed' });
          },
        });
        throw new Error('Expected integrity-check failure');
      } catch (error) {
        expect(String(error)).to.include('Integrity check failed');
      }
    });

    it('coalesces concurrent identical resolve requests into one deno info call', async () => {
      const memo: t.ResolveMemo = { inflight: new Map(), settled: new Map(), alias: new Map() };
      let infoCalls = 0;
      let release!: () => void;
      const gate = new Promise<void>((resolve) => {
        release = resolve;
      });
      const json = JSON.stringify({
        roots: ['jsr:@std/path/join'],
        modules: [
          {
            kind: 'esm',
            local: '/tmp/cache/std-path-join.ts',
            mediaType: 'TypeScript',
            specifier: 'jsr:@std/path/join',
            dependencies: [],
          },
        ],
      });

      const deps = {
        memo,
        async invoke(input: t.Process.InvokeArgs) {
          if (input.args[0] === '--version') {
            return procOutput({ success: true, stdout: 'deno 2.x' });
          }
          infoCalls++;
          await gate;
          return procOutput({ success: true, stdout: json });
        },
      } satisfies t.ResolveDeps;

      const first = resolveDenoWith('jsr:@std/path/join', '/tmp', deps);
      const second = resolveDenoWith('jsr:@std/path/join', '/tmp', deps);
      await Promise.resolve();

      expect(infoCalls).to.eql(1);
      expect(memo.inflight.size).to.eql(1);

      release();
      const [a, b] = await Promise.all([first, second]);

      expect(a).to.eql(b);
      expect(memo.inflight.size).to.eql(0);
    });

    it('clears inflight failures so later retries can resolve cleanly', async () => {
      const memo: t.ResolveMemo = { inflight: new Map(), settled: new Map(), alias: new Map() };
      let fail = true;
      let infoCalls = 0;
      const json = JSON.stringify({
        roots: ['jsr:@std/path/join'],
        modules: [
          {
            kind: 'esm',
            local: '/tmp/cache/std-path-join.ts',
            mediaType: 'TypeScript',
            specifier: 'jsr:@std/path/join',
            dependencies: [],
          },
        ],
      });

      const deps = {
        memo,
        async invoke(input: t.Process.InvokeArgs) {
          if (input.args[0] === '--version') {
            return procOutput({ success: true, stdout: 'deno 2.x' });
          }
          infoCalls++;
          if (fail) return procOutput({ success: false, stderr: 'Integrity check failed' });
          return procOutput({ success: true, stdout: json });
        },
      } satisfies t.ResolveDeps;

      await Promise.allSettled([
        resolveDenoWith('jsr:@std/path/join', '/tmp', deps),
        resolveDenoWith('jsr:@std/path/join', '/tmp', deps),
      ]);

      expect(infoCalls).to.eql(1);
      expect(memo.inflight.size).to.eql(0);

      fail = false;
      const res = await resolveDenoWith('jsr:@std/path/join', '/tmp', deps);

      expect(infoCalls).to.eql(2);
      expect(res).to.eql({
        id: '/tmp/cache/std-path-join.ts',
        kind: 'esm',
        loader: 'TypeScript',
        dependencies: [],
      });
      expect(memo.inflight.size).to.eql(0);
    });

    it('clears inflight null results so later retries can run cleanly', async () => {
      const memo: t.ResolveMemo = { inflight: new Map(), settled: new Map(), alias: new Map() };
      let unresolved = true;
      let infoCalls = 0;
      const json = JSON.stringify({
        roots: ['jsr:@std/path/join'],
        modules: [
          {
            kind: 'esm',
            local: '/tmp/cache/std-path-join.ts',
            mediaType: 'TypeScript',
            specifier: 'jsr:@std/path/join',
            dependencies: [],
          },
        ],
      });

      const deps = {
        memo,
        async invoke(input: t.Process.InvokeArgs) {
          if (input.args[0] === '--version') {
            return procOutput({ success: true, stdout: 'deno 2.x' });
          }
          infoCalls++;
          if (unresolved) return procOutput({ success: false, stderr: 'Module not found' });
          return procOutput({ success: true, stdout: json });
        },
      } satisfies t.ResolveDeps;

      const [a, b] = await Promise.all([
        resolveDenoWith('jsr:@std/path/join', '/tmp', deps),
        resolveDenoWith('jsr:@std/path/join', '/tmp', deps),
      ]);

      expect(a).to.eql(null);
      expect(b).to.eql(null);
      expect(infoCalls).to.eql(1);
      expect(memo.inflight.size).to.eql(0);

      unresolved = false;
      const res = await resolveDenoWith('jsr:@std/path/join', '/tmp', deps);

      expect(infoCalls).to.eql(2);
      expect(res).to.eql({
        id: '/tmp/cache/std-path-join.ts',
        kind: 'esm',
        loader: 'TypeScript',
        dependencies: [],
      });
      expect(memo.inflight.size).to.eql(0);
    });

    it('reuses redirected settled results for later equivalent requests', async () => {
      const memo: t.ResolveMemo = { inflight: new Map(), settled: new Map(), alias: new Map() };
      let infoCalls = 0;
      const deps = {
        memo,
        async invoke(input: t.Process.InvokeArgs) {
          if (input.args[0] === '--version') {
            return procOutput({ success: true, stdout: 'deno 2.x' });
          }
          infoCalls++;
          return procOutput({
            success: true,
            stdout: JSON.stringify({
              roots: ['jsr:@std/path/join'],
              redirects: {
                'jsr:@std/path/join': 'https://jsr.io/@std/path/1.1.4/join.ts',
              },
              modules: [
                {
                  kind: 'esm',
                  local: '/tmp/cache/std-path-join.ts',
                  mediaType: 'TypeScript',
                  specifier: 'https://jsr.io/@std/path/1.1.4/join.ts',
                  dependencies: [],
                },
              ],
            }),
          });
        },
      } satisfies t.ResolveDeps;

      const first = await resolveDenoWith('jsr:@std/path/join', '/tmp', deps);
      const second = await resolveDenoWith('https://jsr.io/@std/path/1.1.4/join.ts', '/tmp', deps);

      expect(first).to.eql(second);
      expect(infoCalls).to.eql(1);
      expect(memo.settled.size).to.eql(1);
    });

    it('keeps settled aliases scoped to the cwd authority world', async () => {
      const memo: t.ResolveMemo = { inflight: new Map(), settled: new Map(), alias: new Map() };
      let infoCalls = 0;
      const deps = {
        memo,
        async invoke(input: t.Process.InvokeArgs) {
          if (input.args[0] === '--version') {
            return procOutput({ success: true, stdout: 'deno 2.x' });
          }
          infoCalls++;
          return procOutput({
            success: true,
            stdout: JSON.stringify({
              roots: ['jsr:@std/path/join'],
              redirects: {
                'jsr:@std/path/join': 'https://jsr.io/@std/path/1.1.4/join.ts',
              },
              modules: [
                {
                  kind: 'esm',
                  local: '/tmp/cache/std-path-join.ts',
                  mediaType: 'TypeScript',
                  specifier: 'https://jsr.io/@std/path/1.1.4/join.ts',
                  dependencies: [],
                },
              ],
            }),
          });
        },
      } satisfies t.ResolveDeps;

      await resolveDenoWith('jsr:@std/path/join', '/tmp/a', deps);
      await resolveDenoWith('https://jsr.io/@std/path/1.1.4/join.ts', '/tmp/b', deps);

      expect(infoCalls).to.eql(2);
      expect(memo.settled.size).to.eql(2);
    });
  });

  describe('vite resolution', () => {
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

      it('re-hydrates remote parent graphs from encoded importers when cache is cold', async () => {
        const parentId = 'https://jsr.io/@sys/http/0.0.210/src/-exports/-http.client.ts';
        const parentResolved = '/tmp/cache/http-export.ts';
        const childId = 'https://jsr.io/@sys/http/0.0.210/src/http.client/mod.ts';
        const childResolved = '/tmp/cache/http-client-mod.ts';
        const importer = toDenoSpecifier('TypeScript', parentId, parentResolved);
        const cache = new Map<string, t.DenoResolved>();

        const res = await resolveViteSpecifier(
          '../http.client/mod.ts',
          cache,
          '/tmp/project',
          importer,
          {
            async invoke(input: t.Process.InvokeArgs) {
              if (input.args[0] === '--version') {
                return procOutput({ success: true, stdout: 'deno 2.x' });
              }

              if (input.args[input.args.length - 1] === parentId) {
                return procOutput({
                  success: true,
                  stdout: JSON.stringify({
                    roots: [parentId],
                    modules: [
                      {
                        kind: 'esm',
                        local: parentResolved,
                        mediaType: 'TypeScript',
                        specifier: parentId,
                        dependencies: [
                          { specifier: '../http.client/mod.ts', code: { specifier: childId } },
                        ],
                      },
                    ],
                  }),
                });
              }

              if (input.args[input.args.length - 1] === childId) {
                return procOutput({
                  success: true,
                  stdout: JSON.stringify({
                    roots: [childId],
                    modules: [
                      {
                        kind: 'esm',
                        local: childResolved,
                        mediaType: 'TypeScript',
                        specifier: childId,
                        dependencies: [],
                      },
                    ],
                  }),
                });
              }

              throw new Error(`Unexpected deno info lookup: ${input.args[input.args.length - 1]}`);
            },
          },
        );

        expect(res).to.eql(toDenoSpecifier('TypeScript', childId, childResolved));
      });

      it('re-hydrates remote parent graphs when cached importer has no dependencies', async () => {
        const parentId =
          'https://jsr.io/@sys/ui-react-devharness/0.0.251/src/ui.use/use.SizeObserver.ts';
        const parentResolved = '/tmp/cache/use.SizeObserver.ts';
        const importer = toDenoSpecifier('TypeScript', parentId, parentResolved);
        const cache = new Map<string, t.DenoResolved>([
          [
            parentResolved,
            { id: parentResolved, kind: 'esm', loader: 'TypeScript', dependencies: [] },
          ],
        ]);

        let npmInfoCalls = 0;

        const res = await resolveViteSpecifier('react', cache, '/tmp/project', importer, {
          async invoke(input: t.Process.InvokeArgs) {
            if (input.args[0] === '--version') {
              return procOutput({ success: true, stdout: 'deno 2.x' });
            }

            if (input.args[input.args.length - 1] === parentId) {
              return procOutput({
                success: true,
                stdout: JSON.stringify({
                  roots: [parentId],
                  modules: [
                    {
                      kind: 'esm',
                      local: parentResolved,
                      mediaType: 'TypeScript',
                      specifier: parentId,
                      dependencies: [
                        { specifier: 'react', code: { specifier: 'npm:react@19.2.4' } },
                      ],
                    },
                  ],
                }),
              });
            }

            if (input.args[input.args.length - 1] === 'npm:react@19.2.4') {
              npmInfoCalls++;
              return procOutput({
                success: true,
                stdout: JSON.stringify({
                  roots: ['npm:react@19.2.4'],
                  modules: [
                    { kind: 'npm', specifier: 'npm:/react@19.2.4', npmPackage: 'react@19.2.4' },
                  ],
                  redirects: { 'npm:react@19.2.4': 'npm:/react@19.2.4' },
                }),
              });
            }

            throw new Error(`Unexpected deno info lookup: ${input.args[input.args.length - 1]}`);
          },
        });

        expect(res).to.eql('react');
        expect(cache.get(parentResolved)?.kind).to.eql('esm');
        if (cache.get(parentResolved)?.kind !== 'esm')
          throw new Error('Expected hydrated parent graph');
        expect(cache.get(parentResolved)?.dependencies.length).to.eql(1);
        expect(npmInfoCalls).to.eql(1);
      });

      it('hydrates remote child graphs before returning wrapped deno ids', async () => {
        const parentResolved = '/tmp/cache/std-path.ts';
        const childId = 'https://jsr.io/@std/path/1.1.4/windows/basename.ts';
        const childResolved = '/tmp/cache/windows-basename.ts';
        const importer = toDenoSpecifier('TypeScript', '@std/path', parentResolved);
        const cache = new Map<string, t.DenoResolved>([
          [
            parentResolved,
            {
              id: parentResolved,
              kind: 'esm',
              loader: 'TypeScript',
              dependencies: [
                {
                  specifier: './windows/basename.ts',
                  resolvedSpecifier: childId,
                  localPath: childResolved,
                  loader: 'TypeScript',
                },
              ],
            },
          ],
        ]);

        const res = await resolveViteSpecifier(
          './windows/basename.ts',
          cache,
          '/tmp/project',
          importer,
          {
            async invoke(input: t.Process.InvokeArgs) {
              if (input.args[0] === '--version') {
                return procOutput({ success: true, stdout: 'deno 2.x' });
              }

              if (input.args[input.args.length - 1] === childId) {
                return procOutput({
                  success: true,
                  stdout: JSON.stringify({
                    roots: [childId],
                    modules: [
                      {
                        kind: 'esm',
                        local: childResolved,
                        mediaType: 'TypeScript',
                        specifier: childId,
                        dependencies: [
                          {
                            specifier: './from_file_url.ts',
                            code: {
                              specifier: 'https://jsr.io/@std/path/1.1.4/windows/from_file_url.ts',
                            },
                          },
                        ],
                      },
                    ],
                  }),
                });
              }

              throw new Error(`Unexpected deno info lookup: ${input.args[input.args.length - 1]}`);
            },
          },
        );

        expect(res).to.eql(toDenoSpecifier('TypeScript', childId, childResolved));
        expect(cache.get(childResolved)?.kind).to.eql('esm');
        if (cache.get(childResolved)?.kind !== 'esm')
          throw new Error('Expected hydrated child graph');
        expect(cache.get(childResolved)?.dependencies.length).to.eql(1);
      });

      it('converts cached npm dependency subpaths to vite package ids', async () => {
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
        let npmInfoCalls = 0;

        const res = await resolveViteSpecifier(
          '@noble/hashes/legacy.js',
          cache,
          '/tmp/project',
          importer,
          {
            async invoke(input: t.Process.InvokeArgs) {
              if (input.args[0] === '--version') {
                return procOutput({ success: true, stdout: 'deno 2.x' });
              }

              if (input.args[input.args.length - 1] === 'npm:@noble/hashes@2.0.1/legacy.js') {
                npmInfoCalls++;
                return procOutput({
                  success: true,
                  stdout: JSON.stringify({
                    roots: ['npm:@noble/hashes@2.0.1/legacy.js'],
                    modules: [
                      {
                        kind: 'npm',
                        specifier: 'npm:@noble/hashes@2.0.1/legacy.js',
                        npmPackage: '@noble/hashes',
                      },
                    ],
                  }),
                });
              }

              throw new Error(`Unexpected deno info lookup: ${input.args[input.args.length - 1]}`);
            },
          },
        );

        expect(res).to.eql('@noble/hashes/legacy.js');
        expect(npmInfoCalls).to.eql(1);
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
                stdout: JSON.stringify({
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
                stdout: JSON.stringify({
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
                stdout: JSON.stringify({
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

        expect(res).to.eql('/tmp/project/node_modules/.deno/react@19.2.4/node_modules/react/index.js');
      });
    });

    describe('plugin load hydration', () => {
      it('hydrates remote module dependencies when load sees a cold cache entry', async () => {
        const fs = await Fs.makeTempDir({ prefix: 'ViteTransport.resolve.load.' });
        try {
          const root = fs.absolute;
          const remoteId = 'https://jsr.io/@sys/ui-react-devharness/0.0.252/src/ui.use/use.SizeObserver.js';
          const remoteResolved = Fs.join(fs.absolute, 'cache/use.SizeObserver.js');
          await Fs.ensureDir(Fs.join(fs.absolute, 'cache'));
          await Fs.write(remoteResolved, `import { useEffect } from 'react';\nexport const ok = useEffect;\n`);
          const denoId = toDenoSpecifier('JavaScript', remoteId, remoteResolved);
          const cache = new Map<string, t.DenoResolved>();
          const plugin = createResolvePlugin(cache, {
            async invoke(input: t.Process.InvokeArgs) {
              if (input.args[0] === '--version') {
                return procOutput({ success: true, stdout: 'deno 2.x' });
              }
              if (input.args[input.args.length - 1] === remoteId) {
                return procOutput({
                  success: true,
                  stdout: JSON.stringify({
                    roots: [remoteId],
                    modules: [
                      {
                        kind: 'esm',
                        local: remoteResolved,
                        mediaType: 'JavaScript',
                        specifier: remoteId,
                        dependencies: [
                          { specifier: 'react', code: { specifier: 'npm:react@19.2.4' } },
                        ],
                      },
                    ],
                  }),
                });
              }
              throw new Error(`Unexpected deno info lookup: ${input.args[input.args.length - 1]}`);
            },
          });
          plugin.configResolved?.call({} as unknown as t.Rollup.PluginContext, { root });
          cache.set(remoteResolved, {
            id: remoteResolved,
            kind: 'esm',
            loader: 'JavaScript',
            dependencies: [],
          });

          const result = await plugin.load.call({} as t.Rollup.PluginContext, denoId);
          const text = typeof result === 'string' ? result : result?.code ?? '';

          expect(text.includes('npm:react@19.2.4')).to.eql(true);
        } finally {
          await Fs.remove(fs.absolute);
        }
      });
    });

    describe('deno info normalization', () => {
      it('falls back to the raw specifier when dependency code specifier is absent', async () => {
        const json = JSON.stringify({
          roots: ['jsr:@std/path/join'],
          redirects: {
            'jsr:@std/path/join': 'https://jsr.io/@std/path/1.1.4/join.ts',
          },
          modules: [
            {
              kind: 'esm',
              local: '/tmp/cache/std-path-join.ts',
              mediaType: 'TypeScript',
              specifier: 'https://jsr.io/@std/path/1.1.4/join.ts',
              dependencies: [
                {
                  specifier: 'jsr:@std/internal@^1.0.12/os',
                },
              ],
            },
          ],
        });

        const res = await resolveDenoWith('jsr:@std/path/join', '/tmp', {
          async invoke(input: t.Process.InvokeArgs) {
            if (input.args[0] === '--version') {
              return procOutput({ success: true, stdout: 'deno 2.x' });
            }
            return procOutput({ success: true, stdout: json });
          },
        });

        expect(res).to.eql({
          id: '/tmp/cache/std-path-join.ts',
          kind: 'esm',
          loader: 'TypeScript',
          dependencies: [
            {
              specifier: 'jsr:@std/internal@^1.0.12/os',
              resolvedSpecifier: 'jsr:@std/internal@^1.0.12/os',
            },
          ],
        });
      });
    });
  });
});
