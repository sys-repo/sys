import { describe, expect, Fs, it, Path } from '../../-test.ts';
import { type t } from '../common.ts';
import {
  createResolvePlugin,
  isDenoSpecifier,
  parseDenoSpecifier,
  resolveDenoWith,
  resolveViteSpecifier,
  toDenoSpecifier,
} from '../u.resolve.ts';
import { procOutput } from './u.fixture.ts';

describe('ViteTransport.resolve', () => {
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
        async invoke(input: t.ProcInvokeArgs) {
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
          async invoke(input: t.ProcInvokeArgs) {
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
                {
                  specifier: './child.ts',
                  resolvedSpecifier: Path.toFileUrl(child).href,
                },
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
            {
              id: childResolved,
              kind: 'esm',
              loader: 'TypeScript',
              dependencies: [],
            },
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
            async invoke(input: t.ProcInvokeArgs) {
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
            async invoke(input: t.ProcInvokeArgs) {
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
        if (cache.get(childResolved)?.kind !== 'esm') throw new Error('Expected hydrated child graph');
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

        const res = await resolveViteSpecifier(
          '@noble/hashes/legacy.js',
          cache,
          '/tmp/project',
          importer,
        );

        expect(res).to.eql('@noble/hashes/legacy.js');
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
          async invoke(input: t.ProcInvokeArgs) {
            if (input.args[0] === '--version') {
              return procOutput({ success: true, stdout: 'deno 2.x' });
            }
            throw new Error(`Unexpected deno info lookup: ${input.args[input.args.length - 1]}`);
          },
        });

        const res = await plugin.resolveId.call(
          {
            async resolve(id: string, _importer?: string, options?: { readonly skipSelf?: boolean }) {
              expect(id).to.eql('@noble/hashes/legacy.js');
              expect(_importer).to.eql(Path.join(Path.cwd(), 'package.json'));
              expect(options?.skipSelf).to.eql(true);
              return undefined;
            },
          },
          '@noble/hashes/legacy.js',
          importer,
        );

        expect(res).to.eql(undefined);
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
          async invoke(input: t.ProcInvokeArgs) {
            if (input.args[0] === '--version') {
              return procOutput({ success: true, stdout: 'deno 2.x' });
            }
            throw new Error(`Unexpected deno info lookup: ${input.args[input.args.length - 1]}`);
          },
        });

        const res = await plugin.resolveId.call(
          {
            async resolve(id: string, _importer?: string, options?: { readonly skipSelf?: boolean }) {
              expect(id).to.eql('@noble/hashes/legacy.js');
              expect(_importer).to.eql(Path.join(Path.cwd(), 'package.json'));
              expect(options?.skipSelf).to.eql(true);
              return { id: '/tmp/node_modules/@noble/hashes/legacy.js' };
            },
          },
          '@noble/hashes/legacy.js',
          importer,
        );

        expect(res).to.eql({ id: '/tmp/node_modules/@noble/hashes/legacy.js' });
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
          async invoke(input: t.ProcInvokeArgs) {
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
