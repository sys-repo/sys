import { describe, expect, Fs, it, Testing } from './common.ts';
import { Deps } from '../mod.ts';

describe('Deps.applyYaml', () => {
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
