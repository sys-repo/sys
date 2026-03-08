import { describe, expect, Fs, it } from '../../src/-test.ts';
import { syncTransportLoaderImport } from '../task.prep.ts';

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
});
