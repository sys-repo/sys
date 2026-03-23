import { describe, expect, Fs, it, Testing } from '../../../-test.ts';
import { DenoFile } from '../../m.DenoFile/mod.ts';
import { DenoDeps } from '../mod.ts';

describe('DenoDeps.applyFiles', () => {
  it('writes deps.yaml and projected deno imports together', async () => {
    const fs = await Testing.dir('DenoDeps.applyFiles');
    const depsPath = fs.join('deps.yaml');
    const denoPath = fs.join('deno.json');
    const deps = [
      DenoDeps.toDep('jsr:@std/path@1.0.8', { target: 'deno.json' }),
      DenoDeps.toDep('npm:react@19.0.0', { target: 'deno.json' }),
    ];

    await Fs.writeJson(denoPath, { name: 'upgrade-app', tasks: { dev: 'deno task dev' } });

    const res = await DenoDeps.applyFiles({ depsPath, denoFilePath: denoPath }, deps);
    const depsFile = await Fs.readText(depsPath);
    const denoFile = await DenoFile.load(denoPath);

    expect(res.yaml.depsFilePath).to.eql(depsPath);
    expect(res.deno.denoFilePath).to.eql(denoPath);
    expect(depsFile.data).to.eql(res.yaml.yaml.text);
    expect(denoFile.data?.imports).to.eql({
      '@std/path': 'jsr:@std/path@1.0.8',
      react: 'npm:react@19.0.0',
    });
    expect(denoFile.data?.tasks).to.eql({ dev: 'deno task dev' });
  });
});
