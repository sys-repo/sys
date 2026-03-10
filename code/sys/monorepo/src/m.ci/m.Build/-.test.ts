import { describe, expect, Fs, it, Testing } from '../../-test.ts';
import { MonorepoCi } from '../mod.ts';

describe('MonorepoCi.Build', () => {
  it('builds matrix YAML from ordered module paths', async () => {
    const fs = await Testing.dir('MonorepoCi.Build.text').create();
    const a = fs.join('code/sys/alpha');
    const b = fs.join('code/sys/beta');

    await Fs.writeJson(Fs.join(a, 'deno.json'), {
      name: '@scope/alpha',
      tasks: { build: 'deno task help' },
    });
    await Fs.writeJson(Fs.join(b, 'deno.json'), {
      name: '@scope/beta',
      tasks: { build: 'deno task help' },
    });

    const yaml = await MonorepoCi.Build.text({ paths: [a, b] });
    expect(yaml.includes('name: build')).to.eql(true);
    expect(yaml.includes('build module → "${{ matrix.name }}"')).to.eql(true);
    expect(yaml.includes('name: ${{ matrix.name }}')).to.eql(true);
    expect(yaml.includes(`path: ${a}`)).to.eql(true);
    expect(yaml.includes('name: "@scope/alpha"')).to.eql(true);
    expect(yaml.includes(`path: ${b}`)).to.eql(true);
    expect(yaml.includes('name: "@scope/beta"')).to.eql(true);
    expect(yaml.indexOf('@scope/alpha') < yaml.indexOf('@scope/beta')).to.eql(true);
    expect(yaml.includes('push:')).to.eql(true);
    expect(yaml.includes('- main')).to.eql(true);
    expect(yaml.includes('pull_request:')).to.eql(false);
  });

  it('writes YAML to disk', async () => {
    const fs = await Testing.dir('MonorepoCi.Build.write').create();
    const moduleDir = fs.join('code/sys/alpha');
    const target = fs.join('.github/workflows/build.yaml');

    await Fs.writeJson(Fs.join(moduleDir, 'deno.json'), {
      name: '@scope/alpha',
      tasks: { build: 'deno task help' },
    });
    const res = await MonorepoCi.Build.write({ paths: [moduleDir], target });

    expect(res.target).to.eql(target);
    expect(res.count).to.eql(1);
    expect(await Fs.exists(target)).to.eql(true);
    const text = (await Fs.readText(target)).data ?? '';
    expect(text).to.eql(res.yaml);
  });

  it('renders explicit push and pull request triggers', async () => {
    const fs = await Testing.dir('MonorepoCi.Build.on').create();
    const moduleDir = fs.join('code/sys/alpha');

    await Fs.writeJson(Fs.join(moduleDir, 'deno.json'), {
      name: '@scope/alpha',
      tasks: { build: 'deno task help' },
    });
    const yaml = await MonorepoCi.Build.text({
      on: {
        pull_request: { branches: ['main'], paths_ignore: ['.github/workflows/jsr.yaml'] },
        push: {
          branches: ['main', 'sample-branch'],
          paths_ignore: ['.github/workflows/jsr.yaml'],
        },
      },
      paths: [moduleDir],
    });

    expect(yaml.includes('push:')).to.eql(true);
    expect(yaml.includes('pull_request:')).to.eql(true);
    expect(yaml.includes('- sample-branch')).to.eql(true);
    expect(yaml.includes('paths-ignore:')).to.eql(true);
    expect(yaml.includes('.github/workflows/jsr.yaml')).to.eql(true);
  });

  it('falls back to the module path when name is missing', async () => {
    const fs = await Testing.dir('MonorepoCi.Build.path-fallback').create();
    const moduleDir = fs.join('code/projects/demo');

    await Fs.writeJson(Fs.join(moduleDir, 'deno.json'), { tasks: { build: 'deno task help' } });
    const yaml = await MonorepoCi.Build.text({ paths: [moduleDir] });

    expect(yaml.includes(`name: "${moduleDir}"`)).to.eql(true);
  });

  it('syncs from a source root and removes the workflow when no build modules exist', async () => {
    const fs = await Testing.dir('MonorepoCi.Build.sync').create();
    const root = fs.join('code/projects');
    const target = '.github/workflows/build.yaml';

    await Fs.writeJson(Fs.join(root, 'alpha/deno.json'), { tasks: { build: 'deno task help' } });
    await Fs.writeJson(Fs.join(root, 'beta/deno.json'), { tasks: { test: 'deno task help' } });

    const written = await MonorepoCi.Build.sync({ cwd: fs.dir, source: { root }, target });
    expect(written.kind).to.eql('written');
    expect(written.count).to.eql(1);
    expect(await Fs.exists(fs.join(target))).to.eql(true);

    await Fs.remove(Fs.join(root, 'alpha'));
    const removed = await MonorepoCi.Build.sync({ cwd: fs.dir, source: { root }, target });
    expect(removed.kind).to.eql('removed');
    expect(await Fs.exists(fs.join(target))).to.eql(false);

    const skipped = await MonorepoCi.Build.sync({ cwd: fs.dir, source: { root }, target });
    expect(skipped.kind).to.eql('skipped');
  });

  it('filters explicit path sources by build task presence', async () => {
    const fs = await Testing.dir('MonorepoCi.Build.sync.paths').create();
    const buildDir = fs.join('code/projects/buildable');
    const testDir = fs.join('code/projects/test-only');

    await Fs.writeJson(Fs.join(buildDir, 'deno.json'), { tasks: { build: 'deno task help' } });
    await Fs.writeJson(Fs.join(testDir, 'deno.json'), { tasks: { test: 'deno task help' } });

    const written = await MonorepoCi.Build.sync({
      cwd: fs.dir,
      source: { paths: [testDir, buildDir] },
      target: '.github/workflows/build.yaml',
    });

    expect(written.kind).to.eql('written');
    if (written.kind !== 'written') throw new Error('expected written result');
    expect(written.count).to.eql(1);
    expect(written.yaml.includes(buildDir)).to.eql(true);
    expect(written.yaml.includes(testDir)).to.eql(false);
  });
});
