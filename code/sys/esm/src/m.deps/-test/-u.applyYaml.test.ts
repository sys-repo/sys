import { describe, expect, expectError, Fs, it, Testing } from './common.ts';
import { Deps } from '../mod.ts';

describe('Deps.applyYaml', () => {
  it('directory at the YAML target → rejects the write failure', async () => {
    const fs = await Testing.dir('EsmDeps.applyYaml.writeFailure');
    const depsPath = fs.join('deps.yaml');
    const entry = Deps.toEntry('jsr:@std/path@1.0.8', { target: 'deno.json' });
    await Fs.ensureDir(depsPath);

    await expectError(() => Deps.applyYaml(depsPath, [entry]));
    expect(await Fs.Is.dir(depsPath)).to.eql(true);
  });

  it('writes canonical deps.yaml text', async () => {
    const fs = await Testing.dir('EsmDeps.applyYaml');
    const depsPath = fs.join('deps.yaml');
    const entries = [
      Deps.toEntry('jsr:@std/path@1.0.8', { target: 'deno.json' }),
      Deps.toEntry('npm:react@19.0.0', { target: 'deno.json' }),
    ];

    const res = await Deps.applyYaml(depsPath, entries);
    const file = await Fs.readText(depsPath);

    expect(res.depsFilePath).to.eql(depsPath);
    expect(file.ok).to.eql(true);
    expect(file.data).to.eql(res.yaml.text);
    expect(file.data).to.include('deno.json:');
    expect(file.data).to.include('jsr:@std/path@1.0.8');
    expect(file.data).to.include('npm:react@19.0.0');
  });
});
