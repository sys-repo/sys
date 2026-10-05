import { describe, expect, it } from '../../-test.ts';
import { ResolutionMode, Workspace } from '@deno/loader';
import { DenoLoaderResolver } from '../u.resolve/u.loader.ts';
import { DenoLoaderResolverFixture } from './u.fixture.loaderResolver.ts';

// These cases resolve installed npm dependencies or load a dependency-bearing graph.
// Explicit invocation preserves their assertions without making them base prerequisites.
describe('ViteTransport loader resolver contract', () => {
  it('resolves npm imports and node builtins through Deno loader authority', async () => {
    const fixture = await DenoLoaderResolverFixture.create('ViteTransport.loader.contract.npm.');
    try {
      using workspace = new Workspace({ configPath: fixture.configPath, noLock: true });
      using loader = await workspace.createLoader();
      const referrer = fixture.appUrl;

      const npm = await loader.resolve('npm:react@19.2.7', referrer, ResolutionMode.Import);
      const bareNpm = await loader.resolve('react', referrer, ResolutionMode.Import);
      const nodeBuiltin = loader.resolveSync('node:path', referrer, ResolutionMode.Import);

      expect(npm.startsWith('file://')).to.eql(true);
      expect(npm.toLowerCase()).to.include('react');
      expect(bareNpm.startsWith('file://')).to.eql(true);
      expect(bareNpm.toLowerCase()).to.include('react');
      expect(nodeBuiltin).to.eql('node:path');
    } finally {
      await fixture.dispose();
    }
  });
});

describe('DenoLoaderResolver', () => {
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
});
