import { describe, expect, Fs, it } from '../../-test.ts';
import { loadDenoModule, mediaTypeToLoader } from '../u.load.ts';
import { canonicalRemoteSpecifier, parseDenoSpecifier, toDenoSpecifier } from '../u.specifier.ts';

const ESBUILD_BINARY_PATH = 'ESBUILD_BINARY_PATH';

describe('ViteTransport.load', () => {
  describe('specifier parsing', () => {
    it('maps deno media types to esbuild loaders', () => {
      expect(mediaTypeToLoader('JSX')).to.eql('jsx');
      expect(mediaTypeToLoader('JavaScript')).to.eql('js');
      expect(mediaTypeToLoader('Json')).to.eql('json');
      expect(mediaTypeToLoader('TSX')).to.eql('tsx');
      expect(mediaTypeToLoader('TypeScript')).to.eql('ts');
    });

    it('normalizes encoded specifier paths', () => {
      const parsed = parseDenoSpecifier('\0deno::TypeScript::./mod.ts::/tmp/x/../mod.ts');
      expect(parsed.resolved).to.eql('/tmp/mod.ts');
    });

    it('canonicalizes malformed and mixed-case remote specifiers', () => {
      expect(canonicalRemoteSpecifier('https:/jsr.io/@sys/std/0.0.341/src/mod.ts')).to.eql(
        'https://jsr.io/@sys/std/0.0.341/src/mod.ts',
      );
      expect(canonicalRemoteSpecifier('HTTPS://JSR.IO/@sys/std/0.0.341/src/mod.ts')).to.eql(
        'https://jsr.io/@sys/std/0.0.341/src/mod.ts',
      );
    });

    it('trims trailing slash on non-root remote paths only', () => {
      expect(canonicalRemoteSpecifier('https://jsr.io/@sys/std/0.0.341/src/mod.ts/')).to.eql(
        'https://jsr.io/@sys/std/0.0.341/src/mod.ts',
      );
      expect(canonicalRemoteSpecifier('https://jsr.io/')).to.eql('https://jsr.io/');
    });

    it('leaves jsr and local specifiers unchanged', () => {
      expect(canonicalRemoteSpecifier('jsr:@sys/std')).to.eql('jsr:@sys/std');
      expect(canonicalRemoteSpecifier('./local.ts')).to.eql('./local.ts');
    });
  });

  describe('direct loads', () => {
    it('passes through javascript content', async () => {
      const fs = await Fs.makeTempDir({ prefix: 'ViteTransport.load.js.' });
      const path = Fs.join(fs.absolute, 'mod.js');
      await Fs.write(path, 'export const ok = true;');

      const res = await loadDenoModule(toDenoSpecifier('JavaScript', './mod.js', path));
      expect(res).to.eql('export const ok = true;');

      await Fs.remove(fs.absolute);
    });

    it('rewrites npm subpath imports to resolved file paths', async () => {
      const fs = await Fs.makeTempDir({ prefix: 'ViteTransport.load.npm-subpath.' });
      const path = Fs.join(fs.absolute, 'mod.js');
      const depPath = Fs.join(
        fs.absolute,
        'node_modules/.deno/@noble+hashes@2.0.1/node_modules/@noble/hashes/legacy.js',
      );
      await Fs.write(path, "export { h32 } from '@noble/hashes/legacy.js';");

      const res = await loadDenoModule(toDenoSpecifier('JavaScript', './mod.js', path), [
        {
          specifier: 'npm:@noble/hashes@2.0.1/legacy.js',
          resolvedSpecifier: Fs.Path.toFileUrl(depPath).href,
        },
      ]);

      expect(res).to.eql(`export { h32 } from '${depPath}';`);

      await Fs.remove(fs.absolute);
    });

    it('rewrites remote deno children to wrapped browser ids for dev transport', async () => {
      const fs = await Fs.makeTempDir({ prefix: 'ViteTransport.load.remote.' });
      const path = Fs.join(fs.absolute, 'mod.js');
      const child = '/tmp/deno-cache/child.ts';
      await Fs.write(path, "export { value } from 'https://jsr.io/@std/path/1.1.4/value.ts';");

      const res = await loadDenoModule(toDenoSpecifier('JavaScript', './mod.js', path), [
        {
          specifier: 'https://jsr.io/@std/path/1.1.4/value.ts',
          resolvedSpecifier: 'https://jsr.io/@std/path/1.1.4/value.ts',
          localPath: child,
          loader: 'TypeScript',
        },
      ], { browserIds: true });

      expect(res).to.eql(
        "export { value } from '/@id/__x00__deno::TypeScript::https://jsr.io/@std/path/1.1.4/value.ts::/tmp/deno-cache/child.ts';",
      );

      await Fs.remove(fs.absolute);
    });

    it('rewrites remote deno children to deno specifiers for build transport', async () => {
      const fs = await Fs.makeTempDir({ prefix: 'ViteTransport.load.remote-build.' });
      const path = Fs.join(fs.absolute, 'mod.js');
      const child = '/tmp/deno-cache/child.ts';
      await Fs.write(path, "export { value } from 'https://jsr.io/@std/path/1.1.4/value.ts';");

      const res = await loadDenoModule(toDenoSpecifier('JavaScript', './mod.js', path), [
        {
          specifier: 'https://jsr.io/@std/path/1.1.4/value.ts',
          resolvedSpecifier: 'https://jsr.io/@std/path/1.1.4/value.ts',
          localPath: child,
          loader: 'TypeScript',
        },
      ]);

      expect(res).to.eql(
        `export { value } from '${toDenoSpecifier('TypeScript', 'https://jsr.io/@std/path/1.1.4/value.ts', child)}';`,
      );

      await Fs.remove(fs.absolute);
    });

    it('wraps json as a default export', async () => {
      const fs = await Fs.makeTempDir({ prefix: 'ViteTransport.load.json.' });
      const path = Fs.join(fs.absolute, 'mod.json');
      await Fs.write(path, '{"ok":true}');

      const res = await loadDenoModule(toDenoSpecifier('Json', './mod.json', path));
      expect(res).to.eql('export default {"ok":true}');

      await Fs.remove(fs.absolute);
    });
  });
});

describe('ViteTransport.load (esbuild)', { sanitizeOps: false, sanitizeResources: false }, () => {
  describe('transforms', () => {
    it('transforms typescript content via esbuild', async () => {
      const fs = await Fs.makeTempDir({ prefix: 'ViteTransport.load.ts.' });
      const path = Fs.join(fs.absolute, 'mod.ts');
      await Fs.write(path, 'export const value: number = 1;');

      const res = await loadDenoModule(toDenoSpecifier('TypeScript', './mod.ts', path));
      expect(typeof res).to.eql('object');
      if (typeof res === 'string') throw new Error('Expected transform result object');
      expect(res.code.includes('const value = 1')).to.eql(true);
      expect(res.map).to.eql(null);

      await Fs.remove(fs.absolute);
    });

    it('reuses cached dev transport transforms for remote immutable modules', async () => {
      const fs = await Fs.makeTempDir({ prefix: 'ViteTransport.load.cache.hit.' });
      const path = Fs.join(fs.absolute, 'cache/mod.ts');
      const cacheDir = Fs.join(fs.absolute, '.vite');
      await Fs.ensureDir(Fs.dirname(path));
      await Fs.write(path, 'export const value: number = 1;');

      const restore = envVar(ESBUILD_BINARY_PATH);
      try {
        Deno.env.delete(ESBUILD_BINARY_PATH);
        const id = toDenoSpecifier('TypeScript', 'https:/jsr.io/@sys/std/0.0.341/src/mod.ts', path);
        const first = await loadDenoModule(id, [], { browserIds: true, transformCacheDir: cacheDir });
        expect(typeof first).to.eql('object');
        if (typeof first === 'string') throw new Error('Expected cached transform object');

        const cacheFiles = await Fs.glob(Fs.join(cacheDir, '.sys-driver-vite', 'transport')).find('*.json');
        expect(cacheFiles.length > 0).to.eql(true);

        Deno.env.set(ESBUILD_BINARY_PATH, Fs.join(fs.absolute, 'missing-esbuild'));
        const second = await loadDenoModule(id, [], { browserIds: true, transformCacheDir: cacheDir });
        expect(second).to.eql(first);
      } finally {
        restore();
        await Fs.remove(fs.absolute);
      }
    });

    it('bypasses persistent transform cache for build transport', async () => {
      const fs = await Fs.makeTempDir({ prefix: 'ViteTransport.load.cache.build.' });
      const path = Fs.join(fs.absolute, 'cache/mod.ts');
      const cacheDir = Fs.join(fs.absolute, '.vite');
      await Fs.ensureDir(Fs.dirname(path));
      await Fs.write(path, 'export const value: number = 1;');

      const restore = envVar(ESBUILD_BINARY_PATH);
      try {
        Deno.env.delete(ESBUILD_BINARY_PATH);
        const id = toDenoSpecifier('TypeScript', 'https://jsr.io/@sys/std/0.0.341/src/mod.ts', path);
        await loadDenoModule(id, [], { browserIds: false, transformCacheDir: cacheDir });

        expect(await Fs.exists(Fs.join(cacheDir, '.sys-driver-vite', 'transport'))).to.eql(false);

        Deno.env.set(ESBUILD_BINARY_PATH, Fs.join(fs.absolute, 'missing-esbuild'));
        await expectReject(loadDenoModule(id, [], { browserIds: false, transformCacheDir: cacheDir }));
      } finally {
        restore();
        await Fs.remove(fs.absolute);
      }
    });

    it('bypasses persistent transform cache for local workspace-style modules', async () => {
      const fs = await Fs.makeTempDir({ prefix: 'ViteTransport.load.cache.local.' });
      const path = Fs.join(fs.absolute, 'mod.ts');
      const cacheDir = Fs.join(fs.absolute, '.vite');
      await Fs.write(path, 'export const value: number = 1;');

      const restore = envVar(ESBUILD_BINARY_PATH);
      try {
        Deno.env.delete(ESBUILD_BINARY_PATH);
        const id = toDenoSpecifier('TypeScript', './mod.ts', path);
        await loadDenoModule(id, [], { browserIds: true, transformCacheDir: cacheDir });

        expect(await Fs.exists(Fs.join(cacheDir, '.sys-driver-vite', 'transport'))).to.eql(false);

        Deno.env.set(ESBUILD_BINARY_PATH, Fs.join(fs.absolute, 'missing-esbuild'));
        await expectReject(loadDenoModule(id, [], { browserIds: true, transformCacheDir: cacheDir }));
      } finally {
        restore();
        await Fs.remove(fs.absolute);
      }
    });

    it('bypasses persistent transform cache for jsr specifiers without immutable remote urls', async () => {
      const fs = await Fs.makeTempDir({ prefix: 'ViteTransport.load.cache.jsr.' });
      const path = Fs.join(fs.absolute, 'mod.ts');
      const cacheDir = Fs.join(fs.absolute, '.vite');
      await Fs.write(path, 'export const value: number = 1;');

      const restore = envVar(ESBUILD_BINARY_PATH);
      try {
        Deno.env.delete(ESBUILD_BINARY_PATH);
        const id = toDenoSpecifier('TypeScript', 'jsr:@sys/std', path);
        await loadDenoModule(id, [], { browserIds: true, transformCacheDir: cacheDir });

        expect(await Fs.exists(Fs.join(cacheDir, '.sys-driver-vite', 'transport'))).to.eql(false);

        Deno.env.set(ESBUILD_BINARY_PATH, Fs.join(fs.absolute, 'missing-esbuild'));
        await expectReject(loadDenoModule(id, [], { browserIds: true, transformCacheDir: cacheDir }));
      } finally {
        restore();
        await Fs.remove(fs.absolute);
      }
    });

    it('misses the cache when rewritten dependency targets change', async () => {
      const fs = await Fs.makeTempDir({ prefix: 'ViteTransport.load.cache.deps.' });
      const path = Fs.join(fs.absolute, 'cache/mod.ts');
      const cacheDir = Fs.join(fs.absolute, '.vite');
      await Fs.ensureDir(Fs.dirname(path));
      await Fs.write(path, "export { value } from 'https://jsr.io/@std/path/1.1.4/value.ts';\n");

      const depA = {
        specifier: 'https://jsr.io/@std/path/1.1.4/value.ts',
        resolvedSpecifier: 'https://jsr.io/@std/path/1.1.4/value.ts',
        localPath: Fs.join(fs.absolute, 'cache/value.a.ts'),
        loader: 'TypeScript' as const,
      };
      const depB = {
        ...depA,
        localPath: Fs.join(fs.absolute, 'cache/value.b.ts'),
      };

      const restore = envVar(ESBUILD_BINARY_PATH);
      try {
        Deno.env.delete(ESBUILD_BINARY_PATH);
        const id = toDenoSpecifier('TypeScript', 'https://jsr.io/@sys/std/0.0.341/src/mod.ts', path);
        await loadDenoModule(id, [depA], { browserIds: true, transformCacheDir: cacheDir });

        Deno.env.set(ESBUILD_BINARY_PATH, Fs.join(fs.absolute, 'missing-esbuild'));
        await expectReject(loadDenoModule(id, [depB], { browserIds: true, transformCacheDir: cacheDir }));
      } finally {
        restore();
        await Fs.remove(fs.absolute);
      }
    });
  });
});

function envVar(key: string) {
  const prev = Deno.env.get(key);
  return () => {
    if (prev === undefined) Deno.env.delete(key);
    else Deno.env.set(key, prev);
  };
}

async function expectReject(input: Promise<unknown>) {
  let rejected = false;
  try {
    await input;
  } catch {
    rejected = true;
  }
  expect(rejected).to.eql(true);
}
