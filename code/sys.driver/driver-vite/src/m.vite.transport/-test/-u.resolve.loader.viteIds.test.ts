import { describe, expect, Fs, Is, it, Path } from '../../-test.ts';
import { type t } from '../common.ts';
import { createResolvePlugin, resolveViteSpecifier } from '../u.resolve/u.resolve.ts';
import { DenoLoaderResolver } from '../u.resolve/u.loader.ts';
import { parseDenoSpecifier, toDenoSpecifier, unwrapViteId } from '../u/u.specifier.ts';
import { DenoLoaderResolverFixture } from './u.fixture.loaderResolver.ts';

/**
 * Loader lookup returns URL authority. These tests prove the narrow adapter
 * contract from loader-resolved file URLs into existing Vite transport IDs and
 * the production resolver's loader-primary routing for loader-clean cases.
 */
describe('DenoLoaderResolver Vite virtual ids', () => {
  const pluginContext = {} as t.Rollup.PluginContext;

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

      const resolved = await resolveViteSpecifier(
        source,
        cache,
        fixture.dir,
        undefined,
        noDenoInfo,
      );

      expect(resolvedUrl).to.eql(fixture.featureUrl);
      expect(resolved).to.eql(resolvedPath);
    } finally {
      await fixture.dispose();
    }
  });

  it('routes loader-clean workspace exports without invoking legacy deno info', async () => {
    const fixture = await DenoLoaderResolverFixture.create('ViteTransport.loader.viteIds.route.');
    try {
      using resolver = await DenoLoaderResolver.create({
        configPath: fixture.configPath,
        noLock: true,
      });

      const source = '@fixture/pkg/feature';
      const cache: t.DenoCache = new Map();
      const viteRoot = Fs.join(fixture.dir, 'vite-root');
      const deps = noDenoInfoWithLoader(resolver);
      const resolved = await resolveViteSpecifier(source, cache, viteRoot, fixture.appUrl, deps);
      const featurePath = Path.fromFileUrl(fixture.featureUrl);

      expect(resolved).to.eql(toDenoSpecifier('TypeScript', source, featurePath));
      expect(cache.get(featurePath)?.kind).to.eql('esm');
    } finally {
      await fixture.dispose();
    }
  });

  it('routes plugin resolution through loader using envDir when Vite root is nested', async () => {
    const fixture = await DenoLoaderResolverFixture.create('ViteTransport.loader.viteIds.envDir.');
    const cache: t.DenoCache = new Map();
    const plugin = createResolvePlugin(cache, noDenoInfo);
    try {
      const source = '@fixture/pkg/feature';
      const viteRoot = Fs.join(fixture.dir, 'src');
      plugin.configResolved?.call(pluginContext, {
        root: viteRoot,
        envDir: fixture.dir,
        command: 'build',
      });

      const resolved = await plugin.resolveId?.call(pluginContext, source, fixture.appUrl, {
        isEntry: false,
      });
      const featurePath = Path.fromFileUrl(fixture.featureUrl);

      expect(resolved).to.eql(toDenoSpecifier('TypeScript', source, featurePath));
    } finally {
      const closeBundle = plugin.closeBundle;
      if (Is.func(closeBundle)) await closeBundle.call(pluginContext);
      await fixture.dispose();
    }
  });

  it('routes direct plugin fallback through nearest workspace when envDir is a workspace child', async () => {
    const fixture = await DenoLoaderResolverFixture.create(
      'ViteTransport.loader.viteIds.ws-envDir.',
    );
    const cache: t.DenoCache = new Map();
    const plugin = createResolvePlugin(cache, noDenoInfo);
    try {
      const source = 'alias/mod.ts';
      const viteRoot = Fs.join(fixture.pkgDir, 'src');
      plugin.configResolved?.call(pluginContext, {
        root: viteRoot,
        envDir: fixture.pkgDir,
        command: 'build',
      });

      const resolved = await plugin.resolveId?.call(pluginContext, source, fixture.appUrl, {
        isEntry: false,
      });
      const aliasPath = Path.fromFileUrl(fixture.aliasUrl);

      expect(resolved).to.eql(toDenoSpecifier('TypeScript', source, aliasPath));
    } finally {
      const closeBundle = plugin.closeBundle;
      if (Is.func(closeBundle)) await closeBundle.call(pluginContext);
      await fixture.dispose();
    }
  });

  it('uses explicit loader config even when local discovery would miss the workspace', async () => {
    const fixture = await DenoLoaderResolverFixture.create(
      'ViteTransport.loader.viteIds.explicit.',
    );
    const cache: t.DenoCache = new Map();
    const plugin = createResolvePlugin(cache, noDenoInfo, {
      configPath: fixture.configPath,
      configDiscovery: 'local',
    });
    try {
      const source = 'alias/mod.ts';
      const viteRoot = Fs.join(fixture.pkgDir, 'src');
      plugin.configResolved?.call(pluginContext, {
        root: viteRoot,
        envDir: fixture.pkgDir,
        command: 'build',
      });

      const resolved = await plugin.resolveId?.call(pluginContext, source, fixture.appUrl, {
        isEntry: false,
      });
      const aliasPath = Path.fromFileUrl(fixture.aliasUrl);

      expect(resolved).to.eql(toDenoSpecifier('TypeScript', source, aliasPath));
    } finally {
      const closeBundle = plugin.closeBundle;
      if (Is.func(closeBundle)) await closeBundle.call(pluginContext);
      await fixture.dispose();
    }
  });

  it('routes loader-clean relative children from virtual importers without deno info', async () => {
    const fixture = await DenoLoaderResolverFixture.create('ViteTransport.loader.viteIds.child.');
    try {
      using resolver = await DenoLoaderResolver.create({
        configPath: fixture.configPath,
        noLock: true,
      });

      const cache: t.DenoCache = new Map();
      const viteRoot = Fs.join(fixture.dir, 'vite-root');
      const deps = noDenoInfoWithLoader(resolver);
      const featurePath = Path.fromFileUrl(fixture.featureUrl);
      const childPath = Path.fromFileUrl(fixture.childUrl);
      const importer = toDenoSpecifier('TypeScript', '@fixture/pkg/feature', featurePath);

      const resolved = await resolveViteSpecifier('./child.ts', cache, viteRoot, importer, deps);

      expect(resolved).to.eql(toDenoSpecifier('TypeScript', './child.ts', childPath));
      expect(cache.get(childPath)?.kind).to.eql('esm');
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

  it('adapts remote loader URL authority without invoking legacy deno info', async () => {
    const remote = 'https://jsr.io/@std/path/1.1.4/mod.ts';
    const cache: t.DenoCache = new Map();
    let invokeCalls = 0;

    const resolved = await resolveViteSpecifier(remote, cache, '/tmp/project', undefined, {
      async resolveLoader() {
        return remote;
      },
      async invoke() {
        invokeCalls++;
        throw new Error('deno info should not be invoked after bridge retirement');
      },
    });

    expect(resolved).to.eql(toDenoSpecifier('TypeScript', remote, remote));
    expect(cache.get(remote)).to.eql({
      id: remote,
      kind: 'esm',
      loader: 'TypeScript',
      dependencies: [],
    });
    expect(invokeCalls).to.eql(0);
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
};

function noDenoInfoWithLoader(
  resolver: { resolve: (id: string, referrer?: string) => Promise<string> },
) {
  return {
    ...noDenoInfo,
    async resolveLoader(id: string, referrer: string | undefined) {
      return await resolver.resolve(id, referrer);
    },
  } satisfies t.ResolveDeps;
}

function toBrowserDenoSpecifier(id: string) {
  return `/@id/${id.replace('\0', '__x00__')}`;
}
