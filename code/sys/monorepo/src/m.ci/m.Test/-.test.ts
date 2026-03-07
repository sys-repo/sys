import { describe, expect, Fs, it, Testing } from '../../-test.ts';
import { MonorepoCi } from '../mod.ts';

describe('MonorepoCi.Test', () => {
  it('builds matrix YAML from ordered module paths', async () => {
    const fs = await Testing.dir('MonorepoCi.Test.text').create();
    const a = fs.join('code/sys/alpha');
    const b = fs.join('code/sys/beta');

    await Fs.writeJson(Fs.join(a, 'deno.json'), {
      name: '@scope/alpha',
      tasks: { test: 'deno task help' },
    });
    await Fs.writeJson(Fs.join(b, 'deno.json'), {
      name: '@scope/beta',
      tasks: { test: 'deno task help' },
    });

    const yaml = await MonorepoCi.Test.text({ paths: [a, b] });
    expect(yaml.includes('name: test')).to.eql(true);
    expect(yaml.includes('test module → "${{ matrix.name }}"')).to.eql(true);
    expect(yaml.includes('name: ${{ matrix.name }}')).to.eql(true);
    expect(yaml.includes(`path: ${a}`)).to.eql(true);
    expect(yaml.includes('name: "@scope/alpha"')).to.eql(true);
    expect(yaml.includes(`path: ${b}`)).to.eql(true);
    expect(yaml.includes('name: "@scope/beta"')).to.eql(true);
    expect(yaml.indexOf('@scope/alpha') < yaml.indexOf('@scope/beta')).to.eql(true);
    expect(yaml.includes('deno task test')).to.eql(true);
    expect(yaml.includes('push:')).to.eql(true);
    expect(yaml.includes('- main')).to.eql(true);
    expect(yaml.includes('pull_request:')).to.eql(false);
  });

  it('writes YAML to disk', async () => {
    const fs = await Testing.dir('MonorepoCi.Test.write').create();
    const moduleDir = fs.join('code/sys/alpha');
    const target = fs.join('.github/workflows/test.yaml');

    await Fs.writeJson(Fs.join(moduleDir, 'deno.json'), {
      name: '@scope/alpha',
      tasks: { test: 'deno task help' },
    });
    const res = await MonorepoCi.Test.write({ paths: [moduleDir], target });

    expect(res.target).to.eql(target);
    expect(res.count).to.eql(1);
    expect(await Fs.exists(target)).to.eql(true);
    const text = (await Fs.readText(target)).data ?? '';
    expect(text).to.eql(res.yaml);
  });

  it('renders explicit push and pull request triggers', async () => {
    const fs = await Testing.dir('MonorepoCi.Test.on').create();
    const moduleDir = fs.join('code/sys/alpha');

    await Fs.writeJson(Fs.join(moduleDir, 'deno.json'), {
      name: '@scope/alpha',
      tasks: { test: 'deno task help' },
    });
    const yaml = await MonorepoCi.Test.text({
      on: {
        pull_request: { branches: ['main'] },
        push: { branches: ['main', 'sample-branch'] },
      },
      paths: [moduleDir],
    });

    expect(yaml.includes('push:')).to.eql(true);
    expect(yaml.includes('pull_request:')).to.eql(true);
    expect(yaml.includes('- sample-branch')).to.eql(true);
  });

  it('falls back to the module path when name is missing', async () => {
    const fs = await Testing.dir('MonorepoCi.Test.path-fallback').create();
    const moduleDir = fs.join('code/projects/demo');

    await Fs.writeJson(Fs.join(moduleDir, 'deno.json'), { tasks: { test: 'deno task help' } });
    const yaml = await MonorepoCi.Test.text({ paths: [moduleDir] });

    expect(yaml.includes(`name: "${moduleDir}"`)).to.eql(true);
  });

  it('syncs from a source root and removes the workflow when no test modules exist', async () => {
    const fs = await Testing.dir('MonorepoCi.Test.sync').create();
    const root = fs.join('code/projects');
    const target = '.github/workflows/test.yaml';

    await Fs.writeJson(Fs.join(root, 'alpha/deno.json'), { tasks: { test: 'deno task help' } });
    await Fs.writeJson(Fs.join(root, 'beta/deno.json'), { tasks: { build: 'deno task help' } });

    const written = await MonorepoCi.Test.sync({ cwd: fs.dir, source: { root }, target });
    expect(written.kind).to.eql('written');
    expect(written.count).to.eql(1);
    expect(await Fs.exists(fs.join(target))).to.eql(true);

    await Fs.remove(Fs.join(root, 'alpha'));
    const removed = await MonorepoCi.Test.sync({ cwd: fs.dir, source: { root }, target });
    expect(removed.kind).to.eql('removed');
    expect(await Fs.exists(fs.join(target))).to.eql(false);

    const skipped = await MonorepoCi.Test.sync({ cwd: fs.dir, source: { root }, target });
    expect(skipped.kind).to.eql('skipped');
  });

  it('filters explicit path sources by test task presence', async () => {
    const fs = await Testing.dir('MonorepoCi.Test.sync.paths').create();
    const testDir = fs.join('code/projects/testable');
    const buildDir = fs.join('code/projects/build-only');

    await Fs.writeJson(Fs.join(testDir, 'deno.json'), { tasks: { test: 'deno task help' } });
    await Fs.writeJson(Fs.join(buildDir, 'deno.json'), { tasks: { build: 'deno task help' } });

    const written = await MonorepoCi.Test.sync({
      cwd: fs.dir,
      source: { paths: [buildDir, testDir] },
      target: '.github/workflows/test.yaml',
    });

    expect(written.kind).to.eql('written');
    if (written.kind !== 'written') throw new Error('expected written result');
    expect(written.count).to.eql(1);
    expect(written.yaml.includes(testDir)).to.eql(true);
    expect(written.yaml.includes(buildDir)).to.eql(false);
  });
});
