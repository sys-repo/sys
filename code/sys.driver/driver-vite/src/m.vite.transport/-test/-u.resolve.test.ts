import { describe, expect, Fs, it, Path, Testing } from '../../-test.ts';
import { type t } from '../common.ts';
import {
  isDenoSpecifier,
  parseDenoSpecifier,
  resolveDenoWith,
  resolveViteSpecifier,
  toDenoSpecifier,
} from '../u.resolve.ts';

describe('ViteTransport.resolve', () => {
  const procOutput = (args: {
    success: boolean;
    stdout?: string;
    stderr?: string;
    code?: number;
  }): t.ProcOutput => ({
    success: args.success,
    code: args.code ?? (args.success ? 0 : 1),
    signal: null,
    text: {
      stdout: args.stdout ?? '',
      stderr: args.stderr ?? '',
    },
    stdout: new Uint8Array(),
    stderr: new Uint8Array(),
    toString() {
      return this.text.stderr || this.text.stdout;
    },
  });

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

    it('resolves file-url dependencies from deno importer cache', async () => {
      const fs = await Testing.dir('ViteTransport.resolve.file-url').create();
      const child = Fs.join(fs.dir, 'child.ts');
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

      const res = await resolveViteSpecifier('./child.ts', cache, fs.dir, importer);
      expect(res).to.eql(child);
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
