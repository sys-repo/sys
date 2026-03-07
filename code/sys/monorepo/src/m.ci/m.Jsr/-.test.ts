import { Fs } from '@sys/fs';

import { describe, expect, it, Testing } from '../../-test.ts';
import { MonorepoCi } from '../mod.ts';

describe('MonorepoCi.Jsr', () => {
  it('builds YAML from ordered module paths', async () => {
    const fs = await Testing.dir('MonorepoCi.Jsr.text').create();
    const a = fs.join('code/sys/alpha');
    const b = fs.join('code/sys/beta');

    await Fs.writeJson(Fs.join(a, 'deno.json'), { name: '@scope/alpha' });
    await Fs.writeJson(Fs.join(b, 'deno.json'), { name: '@scope/beta' });

    const yaml = await MonorepoCi.Jsr.text({ paths: [a, b] });
    expect(yaml.includes('name: ci')).to.eql(true);
    expect(yaml.includes('publish module → "@scope/alpha"')).to.eql(true);
    expect(yaml.includes('publish module → "@scope/beta"')).to.eql(true);
    expect(yaml.indexOf('@scope/alpha') < yaml.indexOf('@scope/beta')).to.eql(true);
    expect(yaml.includes(`cd ${a}`)).to.eql(true);
    expect(yaml.includes(`cd ${b}`)).to.eql(true);
    expect(yaml.includes('push:')).to.eql(true);
    expect(yaml.includes('- main')).to.eql(true);
    expect(yaml.includes('pull_request:')).to.eql(false);
  });

  it('writes YAML to disk', async () => {
    const fs = await Testing.dir('MonorepoCi.Jsr.write').create();
    const moduleDir = fs.join('code/sys/alpha');
    const target = fs.join('.github/workflows/jsr.yaml');

    await Fs.writeJson(Fs.join(moduleDir, 'deno.json'), { name: '@scope/alpha' });
    const res = await MonorepoCi.Jsr.write({ paths: [moduleDir], target });

    expect(res.target).to.eql(target);
    expect(res.count).to.eql(1);
    expect(await Fs.exists(target)).to.eql(true);
    const text = (await Fs.readText(target)).data ?? '';
    expect(text).to.eql(res.yaml);
  });

  it('renders explicit push and pull request triggers', async () => {
    const fs = await Testing.dir('MonorepoCi.Jsr.on').create();
    const moduleDir = fs.join('code/sys/alpha');

    await Fs.writeJson(Fs.join(moduleDir, 'deno.json'), { name: '@scope/alpha' });
    const yaml = await MonorepoCi.Jsr.text({
      on: { pull_request: ['main'], push: ['main', 'phil-work'] },
      paths: [moduleDir],
    });

    expect(yaml.includes('push:')).to.eql(true);
    expect(yaml.includes('pull_request:')).to.eql(true);
    expect(yaml.includes('- phil-work')).to.eql(true);
  });
});
