import { describe, expect, it } from '../../-test.ts';
import { RequestedModuleType } from '@deno/loader';
import { DenoLoaderResolver } from '../u.resolve/u.loader.ts';
import { DenoLoaderResolverFixture } from './u.fixture.loaderResolver.ts';

/**
 * The seam is intentionally not wired into the Vite plugin yet. These tests prove
 * our wrapper preserves Deno-loader authority before the production resolver is
 * routed through it.
 */
describe('DenoLoaderResolver', () => {
  it('resolves workspace exports, import-map aliases, local children, and JSON modules', async () => {
    const fixture = await DenoLoaderResolverFixture.create('ViteTransport.loader.seam.workspace.');
    try {
      using resolver = await DenoLoaderResolver.create({
        configPath: fixture.configPath,
        noLock: true,
      });

      const workspaceExport = resolver.resolveSync('@fixture/pkg/feature', fixture.appUrl);
      const alias = resolver.resolveSync('alias/mod.ts', fixture.appUrl);
      const localChild = resolver.resolveSync('./child.ts', fixture.featureUrl);
      const json = resolver.resolveSync('./data.json', fixture.featureUrl);

      expect(workspaceExport).to.eql(fixture.featureUrl);
      expect(alias).to.eql(fixture.aliasUrl);
      expect(localChild).to.eql(fixture.childUrl);
      expect(json).to.eql(fixture.jsonUrl);

      const loadedJson = await resolver.load(json, {
        requestedModuleType: RequestedModuleType.Json,
      });
      expect(loadedJson.kind).to.eql('module');
      if (loadedJson.kind === 'module') {
        const code = new TextDecoder().decode(loadedJson.code);
        expect(code).to.include('fixture');
      }
    } finally {
      await fixture.dispose();
    }
  });

  it('resolves npm imports and node builtins through seam authority', async () => {
    const fixture = await DenoLoaderResolverFixture.create('ViteTransport.loader.seam.npm.');
    try {
      using resolver = await DenoLoaderResolver.create({
        configPath: fixture.configPath,
        noLock: true,
      });

      const npm = await resolver.resolve('npm:react@19.2.7', fixture.appUrl);
      const bareNpm = await resolver.resolve('react', fixture.appUrl);
      const nodeBuiltin = resolver.resolveSync('node:path', fixture.appUrl);

      expect(npm.startsWith('file://')).to.eql(true);
      expect(npm.toLowerCase()).to.include('react');
      expect(bareNpm.startsWith('file://')).to.eql(true);
      expect(bareNpm.toLowerCase()).to.include('react');
      expect(nodeBuiltin).to.eql('node:path');
    } finally {
      await fixture.dispose();
    }
  });

  it('resolves remote children from concrete HTTPS referrers through the seam', async () => {
    const fixture = await DenoLoaderResolverFixture.create('ViteTransport.loader.seam.remote.');
    try {
      using resolver = await DenoLoaderResolver.create({
        configPath: fixture.configPath,
        noLock: true,
      });

      const referrer = 'https://jsr.io/@std/path/1.1.2/mod.ts';
      const child = resolver.resolveSync('./posix/mod.ts', referrer);

      expect(child).to.eql('https://jsr.io/@std/path/1.1.2/posix/mod.ts');
    } finally {
      await fixture.dispose();
    }
  });

  it('accepts entrypoints before resolving from the loader graph', async () => {
    const fixture = await DenoLoaderResolverFixture.create('ViteTransport.loader.seam.entrypoint.');
    try {
      using resolver = await DenoLoaderResolver.create({
        configPath: fixture.configPath,
        entrypoints: [fixture.appUrl],
        noLock: true,
      });

      const workspaceExport = resolver.resolveSync('@fixture/pkg/feature', fixture.appUrl);
      expect(workspaceExport).to.eql(fixture.featureUrl);
    } finally {
      await fixture.dispose();
    }
  });

  it('fails clearly after disposal', async () => {
    const fixture = await DenoLoaderResolverFixture.create('ViteTransport.loader.seam.dispose.');
    try {
      const resolver = await DenoLoaderResolver.create({
        configPath: fixture.configPath,
        noLock: true,
      });
      resolver[Symbol.dispose]();

      expect(() => resolver.resolveSync('@fixture/pkg/feature', fixture.appUrl)).to.throw(
        'Deno loader resolver has been disposed.',
      );
    } finally {
      await fixture.dispose();
    }
  });
});
