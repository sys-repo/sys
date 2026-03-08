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
