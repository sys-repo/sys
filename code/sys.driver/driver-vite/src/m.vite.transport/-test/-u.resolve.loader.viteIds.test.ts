import { describe, expect, Fs, it, Path } from '../../-test.ts';
import { type t } from '../common.ts';
import { DenoLoaderResolver } from '../u.resolve.loader.ts';
import { resolveViteSpecifier } from '../u.resolve.ts';
import { parseDenoSpecifier, toDenoSpecifier, unwrapViteId } from '../u.specifier.ts';
import { DenoLoaderResolverFixture } from './u.fixture.loaderResolver.ts';

/**
 * Loader lookup returns URL authority. These tests prove the narrow adapter
 * contract from loader-resolved file URLs into existing Vite transport IDs
 * without routing production resolution through the loader seam yet.
 */
describe('DenoLoaderResolver Vite virtual ids', () => {
  it('adapts loader file urls to build virtual ids for out-of-root modules', async () => {
    const fixture = await DenoLoaderResolverFixture.create('ViteTransport.loader.viteIds.build.');
    try {
      using resolver = await DenoLoaderResolver.create({
        configPath: fixture.configPath,
        noLock: true,
      });

      const source = '@fixture/pkg/feature';
      const resolvedUrl = resolver.resolveSync(source, fixture.appUrl);
      const resolvedPath = Path.fromFileUrl(resolvedUrl);
      const viteRoot = Fs.join(fixture.dir, 'vite-root');
      const cache: t.DenoCache = new Map([
        [
          source,
          {
            id: resolvedPath,
            kind: 'esm',
            loader: 'TypeScript',
            dependencies: [],
          },
        ],
      ]);

      const resolved = await resolveViteSpecifier(source, cache, viteRoot, undefined, noDenoInfo);
      const expected = toDenoSpecifier('TypeScript', source, resolvedPath);

      expect(resolvedUrl).to.eql(fixture.featureUrl);
      expect(resolved).to.eql(expected);
      expect(parseDenoSpecifier(expected)).to.eql({
        loader: 'TypeScript',
        id: source,
        resolved: resolvedPath,
      });
    } finally {
      await fixture.dispose();
    }
  });

  it('keeps loader file urls as direct Vite ids when modules are inside the Vite root', async () => {
    const fixture = await DenoLoaderResolverFixture.create('ViteTransport.loader.viteIds.root.');
    try {
      using resolver = await DenoLoaderResolver.create({
        configPath: fixture.configPath,
        noLock: true,
      });

      const source = '@fixture/pkg/feature';
      const resolvedUrl = resolver.resolveSync(source, fixture.appUrl);
      const resolvedPath = Path.fromFileUrl(resolvedUrl);
      const cache: t.DenoCache = new Map([
        [
          source,
          {
            id: resolvedPath,
            kind: 'esm',
            loader: 'TypeScript',
            dependencies: [],
          },
        ],
      ]);

      const resolved = await resolveViteSpecifier(source, cache, fixture.dir, undefined, noDenoInfo);

      expect(resolvedUrl).to.eql(fixture.featureUrl);
      expect(resolved).to.eql(resolvedPath);
    } finally {
      await fixture.dispose();
    }
  });

  it('round-trips build virtual ids through Vite dev browser encoding', async () => {
    const fixture = await DenoLoaderResolverFixture.create('ViteTransport.loader.viteIds.dev.');
    try {
      using resolver = await DenoLoaderResolver.create({
        configPath: fixture.configPath,
        noLock: true,
      });

      const source = '@fixture/pkg/feature';
      const resolvedUrl = resolver.resolveSync(source, fixture.appUrl);
      const resolvedPath = Path.fromFileUrl(resolvedUrl);
      const buildId = toDenoSpecifier('TypeScript', source, resolvedPath);
      const devId = toBrowserDenoSpecifier(buildId);
      const unwrapped = unwrapViteId(devId);

      expect(devId).to.eql(`/@id/__x00__deno::TypeScript::${source}::${resolvedPath}`);
      expect(unwrapped).to.eql(buildId);
      expect(parseDenoSpecifier(unwrapped)).to.eql({
        loader: 'TypeScript',
        id: source,
        resolved: resolvedPath,
      });
    } finally {
      await fixture.dispose();
    }
  });

  it('characterizes remote loader children as URL authority, not virtual file ids', async () => {
    const fixture = await DenoLoaderResolverFixture.create('ViteTransport.loader.viteIds.remote.');
    try {
      using resolver = await DenoLoaderResolver.create({
        configPath: fixture.configPath,
        noLock: true,
      });

      const referrer = 'https://jsr.io/@std/path/1.1.2/mod.ts';
      const child = resolver.resolveSync('./posix/mod.ts', referrer);

      expect(child).to.eql('https://jsr.io/@std/path/1.1.2/posix/mod.ts');
      expect(child.startsWith('file://')).to.eql(false);
    } finally {
      await fixture.dispose();
    }
  });
});

const noDenoInfo: t.ResolveDeps = {
  async invoke() {
    throw new Error('deno info should not be invoked by loader virtual-id adapter tests');
  },
  memo: { inflight: new Map(), settled: new Map(), alias: new Map() },
};

function toBrowserDenoSpecifier(id: string) {
  return `/@id/${id.replace('\0', '__x00__')}`;
}
