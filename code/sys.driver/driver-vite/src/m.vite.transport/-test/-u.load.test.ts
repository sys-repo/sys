import { describe, expect, Fs, it } from '../../-test.ts';
import { loadDenoModule, mediaTypeToLoader, parseDenoSpecifier } from '../u.load.ts';
import { toDenoSpecifier } from '../u.resolve.ts';

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
      const depPath = Fs.join(fs.absolute, 'node_modules/.deno/@noble+hashes@2.0.1/node_modules/@noble/hashes/legacy.js');
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

    it('rewrites remote deno children to wrapped browser ids', async () => {
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
      ]);

      expect(res).to.eql(
        "export { value } from '/@id/__x00__deno::TypeScript::https://jsr.io/@std/path/1.1.4/value.ts::/tmp/deno-cache/child.ts';",
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
  });
});
