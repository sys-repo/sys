import { describe, expect, it } from '../../-test.ts';
import { RequestedModuleType, ResolutionMode, Workspace } from '@deno/loader';
import { DenoLoaderResolverFixture } from './u.fixture.loaderResolver.ts';

/**
 * These tests are the deletion gates for the legacy `deno info` lookup bridge.
 * They prove the Deno-loader resolver contract independently from the current
 * transport resolver so the next commits can add a loader-backed seam without
 * deleting the old path by optimism.
 */
describe('ViteTransport loader resolver contract', () => {
  it('resolves workspace exports, import-map aliases, local children, and JSON modules', async () => {
    const fixture = await DenoLoaderResolverFixture.create(
      'ViteTransport.loader.contract.workspace.',
    );
    try {
      using workspace = new Workspace({ configPath: fixture.configPath, noLock: true });
      using loader = await workspace.createLoader();
      const referrer = fixture.appUrl;

      const workspaceExport = loader.resolveSync(
        '@fixture/pkg/feature',
        referrer,
        ResolutionMode.Import,
      );
      const alias = loader.resolveSync('alias/mod.ts', referrer, ResolutionMode.Import);
      const localChild = loader.resolveSync(
        './child.ts',
        fixture.featureUrl,
        ResolutionMode.Import,
      );
      const json = loader.resolveSync('./data.json', fixture.featureUrl, ResolutionMode.Import);

      expect(workspaceExport).to.eql(fixture.featureUrl);
      expect(alias).to.eql(fixture.aliasUrl);
      expect(localChild).to.eql(fixture.childUrl);
      expect(json).to.eql(fixture.jsonUrl);

      const loadedJson = await loader.load(json, RequestedModuleType.Json);
      expect(loadedJson.kind).to.eql('module');
      if (loadedJson.kind === 'module') {
        const code = new TextDecoder().decode(loadedJson.code);
        expect(code).to.include('fixture');
      }
    } finally {
      await fixture.dispose();
    }
  });

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

  it('resolves remote children from concrete HTTPS referrers', async () => {
    const fixture = await DenoLoaderResolverFixture.create('ViteTransport.loader.contract.remote.');
    try {
      using workspace = new Workspace({ configPath: fixture.configPath, noLock: true });
      using loader = await workspace.createLoader();

      const referrer = 'https://jsr.io/@std/path/1.1.2/mod.ts';
      const child = loader.resolveSync('./posix/mod.ts', referrer, ResolutionMode.Import);

      expect(child).to.eql('https://jsr.io/@std/path/1.1.2/posix/mod.ts');
    } finally {
      await fixture.dispose();
    }
  });
});
