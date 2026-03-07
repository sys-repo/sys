import { describe, expect, Fs, it, Testing } from '../../-test.ts';
import { MonorepoCi } from '../mod.ts';

describe('MonorepoCi.Jsr', () => {
  it('builds YAML from ordered module paths', async () => {
    const fs = await Testing.dir('MonorepoCi.Jsr.text').create();
    const a = fs.join('code/sys/alpha');
    const b = fs.join('code/sys/beta');

    await Fs.writeJson(Fs.join(a, 'deno.json'), { name: '@scope/alpha' });
    await Fs.writeJson(Fs.join(b, 'deno.json'), { name: '@scope/beta' });

    const yaml = await MonorepoCi.Jsr.text({ paths: [a, b] });
    expect(yaml.includes('name: jsr')).to.eql(true);
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
      on: { pull_request: ['main'], push: ['main', 'sample-branch'] },
      paths: [moduleDir],
    });

    expect(yaml.includes('push:')).to.eql(true);
    expect(yaml.includes('pull_request:')).to.eql(true);
    expect(yaml.includes('- sample-branch')).to.eql(true);
  });

  it('syncs from explicit paths and removes the workflow when no modules remain', async () => {
    const fs = await Testing.dir('MonorepoCi.Jsr.sync').create();
    const moduleDir = fs.join('code/sys/alpha');
    const target = '.github/workflows/jsr.yaml';

    await Fs.writeJson(Fs.join(moduleDir, 'deno.json'), { name: '@scope/alpha' });
    const written = await MonorepoCi.Jsr.sync({
      cwd: fs.dir,
      source: { paths: [moduleDir] },
      target,
    });
    expect(written.kind).to.eql('written');
    expect(written.count).to.eql(1);
    expect(await Fs.exists(fs.join(target))).to.eql(true);

    const removed = await MonorepoCi.Jsr.sync({ cwd: fs.dir, source: { paths: [] }, target });
    expect(removed.kind).to.eql('removed');
    expect(await Fs.exists(fs.join(target))).to.eql(false);

    const skipped = await MonorepoCi.Jsr.sync({ cwd: fs.dir, source: { paths: [] }, target });
    expect(skipped.kind).to.eql('skipped');
  });

  it('excludes unnamed modules during root discovery', async () => {
    const fs = await Testing.dir('MonorepoCi.Jsr.root-filter').create();
    const root = fs.join('code/projects');

    await Fs.writeJson(Fs.join(root, 'alpha/deno.json'), { name: '@scope/alpha' });
    await Fs.writeJson(Fs.join(root, 'beta/deno.json'), { tasks: { build: 'deno task help' } });

    const written = await MonorepoCi.Jsr.sync({
      cwd: fs.dir,
      source: { root },
      target: '.github/workflows/jsr.yaml',
    });

    expect(written.kind).to.eql('written');
    if (written.kind !== 'written') throw new Error('expected written result');
    expect(written.count).to.eql(1);
    expect(written.yaml.includes('@scope/alpha')).to.eql(true);
    expect(written.yaml.includes('beta')).to.eql(false);
  });
});
