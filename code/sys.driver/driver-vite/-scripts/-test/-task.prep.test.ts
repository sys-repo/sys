import type * as dt from '@sys/driver-deno/t';
import { describe, expect, Fs, it } from '../../src/-test.ts';
import { SAMPLE } from '../../src/-test/u.SAMPLE.ts';
import { syncPublishedFixture, syncPublishedFixtureImport, syncPublishedFixtureImports } from '../task.prep.u.published.ts';
import { PUBLISHED_FIXTURE_DIRS, syncTransportLoaderImport } from '../task.prep.ts';

describe('driver-vite prep', () => {
  it('syncs the transport loader import from root deps.yaml', async () => {
    const fs = await Fs.makeTempDir({ prefix: 'driver-vite.prep.' });
    const depsPath = Fs.join(fs.absolute, 'deps.yaml');
    const targetPath = Fs.join(fs.absolute, 'u.load.ts');

    await Fs.write(
      depsPath,
      `
        groups:
          build/tools/vite:
            - import: npm:esbuild@0.27.3

        deno.json:
          - group: build/tools/vite
      `,
    );

    await Fs.write(
      targetPath,
      "import { transform } from 'npm:esbuild@0.27.2';\nexport const ok = true;\n",
    );

    await syncTransportLoaderImport({ depsPath, targetPath });

    const text = (await Fs.readText(targetPath)).data ?? '';
    expect(text).to.include("from 'npm:esbuild@0.27.3'");
    expect(text).to.not.include("from 'npm:esbuild@0.27.2'");

    await Fs.remove(fs.absolute);
  });

  it('pins a published fixture vite config to the current workspace driver-vite version', async () => {
    const fs = await Fs.makeTempDir({ prefix: 'driver-vite.bridge-prep.' });
    const rootDenoJson = Fs.join(fs.absolute, 'deno.json');
    const targetPath = Fs.join(fs.absolute, 'vite.config.ts');
    const denoFile: Pick<dt.DenoFileLib, 'workspaceVersion'> = {
      workspaceVersion(name, src) {
        expect(name).to.eql('@sys/driver-vite');
        expect(src).to.eql(rootDenoJson);
        return Promise.resolve('0.0.297');
      },
    };

    await Fs.write(rootDenoJson, '{ "workspace": [] }\n');
    await Fs.write(
      targetPath,
      "import { Vite } from 'jsr:@sys/driver-vite@0.0.295';\nexport default Vite;\n",
    );

    await syncPublishedFixtureImport({ rootDenoJson, targetPath, denoFile });

    const text = (await Fs.readText(targetPath)).data ?? '';
    expect(text).to.include("from 'jsr:@sys/driver-vite@0.0.297'");
    expect(text).to.not.include("from 'jsr:@sys/driver-vite@0.0.295'");

    await Fs.remove(fs.absolute);
  });

  it('syncs published fixture imports from workspace version authority', async () => {
    const fs = await Fs.makeTempDir({ prefix: 'driver-vite.published-imports-prep.' });
    const rootDenoJson = Fs.join(fs.absolute, 'deno.json');
    const targetPath = Fs.join(fs.absolute, 'imports.json');
    const denoFile: Pick<dt.DenoFileLib, 'workspaceVersion'> = {
      workspaceVersion(name, src) {
        expect(src).to.eql(rootDenoJson);
        if (name === '@sys/http') return Promise.resolve('0.0.217');
        throw new Error(`Unexpected package lookup: ${name}`);
      },
    };

    await Fs.write(rootDenoJson, '{ "workspace": [] }\n');
    await Fs.write(
      targetPath,
      JSON.stringify({ imports: { '@sys/http/client': 'jsr:@sys/http@0.0.210/client' } }, null, 2) + '\n',
    );

    await syncPublishedFixtureImports({ rootDenoJson, targetPath, denoFile });

    const data = (await Fs.readJson<{ imports?: Record<string, string> }>(targetPath)).data;
    expect(data?.imports?.['@sys/http/client']).to.eql('jsr:@sys/http@0.0.217/client');

    await Fs.remove(fs.absolute);
  });

  it('syncs all published fixture files for a sample directory', async () => {
    const fs = await Fs.makeTempDir({ prefix: 'driver-vite.published-fixture-prep.' });
    const rootDenoJson = Fs.join(fs.absolute, 'deno.json');
    const fixtureDir = Fs.join(fs.absolute, 'fixture');
    const denoFile: Pick<dt.DenoFileLib, 'workspaceVersion'> = {
      workspaceVersion(name, src) {
        expect(src).to.eql(rootDenoJson);
        if (name === '@sys/driver-vite') return Promise.resolve('0.0.297');
        if (name === '@sys/ui-react') return Promise.resolve('0.0.251');
        if (name === '@sys/ui-dom') return Promise.resolve('0.0.237');
        return Promise.resolve('0.0.999');
      },
    };

    await Fs.write(rootDenoJson, '{ "workspace": [] }\n');
    await Fs.ensureDir(fixtureDir);
    await Fs.write(
      Fs.join(fixtureDir, 'vite.config.ts'),
      "import { Vite } from 'jsr:@sys/driver-vite@0.0.295';\nexport default Vite;\n",
    );
    await Fs.write(
      Fs.join(fixtureDir, 'imports.json'),
      JSON.stringify(
        {
          imports: {
            '@sys/ui-react': 'jsr:@sys/ui-react@0.0.245',
            '@sys/ui-dom': 'jsr:@sys/ui-dom@0.0.200',
          },
        },
        null,
        2,
      ) + '\n',
    );

    await syncPublishedFixture({ rootDenoJson, dir: fixtureDir, denoFile });

    const configText = (await Fs.readText(Fs.join(fixtureDir, 'vite.config.ts'))).data ?? '';
    expect(configText).to.include("from 'jsr:@sys/driver-vite@0.0.297'");

    const imports =
      (await Fs.readJson<{ imports?: Record<string, string> }>(Fs.join(fixtureDir, 'imports.json'))).data
        ?.imports ?? {};
    expect(imports['@sys/ui-react']).to.eql('jsr:@sys/ui-react@0.0.251');
    expect(imports['@sys/ui-dom']).to.eql('jsr:@sys/ui-dom@0.0.237');

    await Fs.remove(fs.absolute);
  });

  it('covers every published sample fixture in prep', () => {
    expect(PUBLISHED_FIXTURE_DIRS).to.eql([
      SAMPLE.Dirs.samplePublishedBaseline,
      SAMPLE.Dirs.samplePublishedUiBaseline,
      SAMPLE.Dirs.samplePublishedUiComponents,
    ]);
  });
});
