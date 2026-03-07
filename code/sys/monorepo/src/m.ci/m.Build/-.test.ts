import { Fs } from '@sys/fs';

import { describe, expect, it, Testing } from '../../-test.ts';
import { MonorepoCi } from '../mod.ts';

describe('MonorepoCi.Build', () => {
  it('builds matrix YAML from ordered module paths', async () => {
    const fs = await Testing.dir('MonorepoCi.Build.text').create();
    const a = fs.join('code/sys/alpha');
    const b = fs.join('code/sys/beta');

    await Fs.writeJson(Fs.join(a, 'deno.json'), { name: '@scope/alpha', tasks: { build: 'deno task help' } });
    await Fs.writeJson(Fs.join(b, 'deno.json'), { name: '@scope/beta', tasks: { build: 'deno task help' } });

    const yaml = await MonorepoCi.Build.text({ paths: [a, b] });
    expect(yaml.includes('name: build')).to.eql(true);
    expect(yaml.includes('build module → "${{ matrix.name }}"')).to.eql(true);
    expect(yaml.includes(`path: ${a}`)).to.eql(true);
    expect(yaml.includes('name: "@scope/alpha"')).to.eql(true);
    expect(yaml.includes(`path: ${b}`)).to.eql(true);
    expect(yaml.includes('name: "@scope/beta"')).to.eql(true);
    expect(yaml.indexOf('@scope/alpha') < yaml.indexOf('@scope/beta')).to.eql(true);
  });

  it('writes YAML to disk', async () => {
    const fs = await Testing.dir('MonorepoCi.Build.write').create();
    const moduleDir = fs.join('code/sys/alpha');
    const target = fs.join('.github/workflows/build.yaml');

    await Fs.writeJson(Fs.join(moduleDir, 'deno.json'), { name: '@scope/alpha', tasks: { build: 'deno task help' } });
    const res = await MonorepoCi.Build.write({ paths: [moduleDir], target });

    expect(res.target).to.eql(target);
    expect(res.count).to.eql(1);
    expect(await Fs.exists(target)).to.eql(true);
    const text = (await Fs.readText(target)).data ?? '';
    expect(text).to.eql(res.yaml);
  });
});
