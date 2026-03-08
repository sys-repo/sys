import type * as dt from '@sys/driver-deno/t';
import { describe, expect, Fs, it } from '../../src/-test.ts';
import { syncPublishedBridgeImport, syncTransportLoaderImport } from '../task.prep.ts';

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

  it('pins the published bridge fixture to the current workspace driver-vite version', async () => {
    const fs = await Fs.makeTempDir({ prefix: 'driver-vite.bridge-prep.' });
    const rootDenoJson = Fs.join(fs.absolute, 'deno.json');
    const targetPath = Fs.join(fs.absolute, 'vite.config.ts');
    const denoFile: Pick<dt.DenoFileLib, 'workspaceVersion'> = {
      workspaceVersion(name, src) {
        expect(name).to.eql('@sys/driver-vite');
        expect(src).to.eql(rootDenoJson);
        return Promise.resolve('0.0.293');
      },
    };

    await Fs.write(rootDenoJson, '{ "workspace": [] }\n');
    await Fs.write(
      targetPath,
      "import { Vite } from 'jsr:@sys/driver-vite';\nexport default Vite;\n",
    );

    await syncPublishedBridgeImport({ rootDenoJson, targetPath, denoFile });

    const text = (await Fs.readText(targetPath)).data ?? '';
    expect(text).to.include("from 'jsr:@sys/driver-vite@0.0.293'");
    expect(text).to.not.include("from 'jsr:@sys/driver-vite';");

    await Fs.remove(fs.absolute);
  });
});
