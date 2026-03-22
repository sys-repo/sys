import { describe, expect, Fs, it, Testing } from '../-test.ts';
import { MonorepoPkg } from './mod.ts';
import { renderPkg } from './u.render.ts';

describe(`Monorepo.Pkg`, () => {
  it('API', async () => {
    const m = await import('@sys/workspace/pkg');
    expect(m.MonorepoPkg).to.equal(MonorepoPkg);
  });

  it('discovers package roots from explicit deno.json include globs', async () => {
    const fs = await Testing.dir('MonorepoPkg.sync.discovery');

    await Fs.writeJson(fs.join('code/projects/a/deno.json'), {
      name: '@scope/a',
      version: '1.0.0',
    });
    await Fs.write(
      fs.join('code/projects/a/src/pkg.ts'),
      renderPkg({ name: '@scope/a', version: '1.0.0' }),
    );

    await Fs.writeJson(fs.join('deploy/app/deno.json'), {
      name: '@scope/deploy',
      version: '2.0.0',
    });
    await Fs.write(
      fs.join('deploy/app/src/pkg.ts'),
      renderPkg({ name: '@scope/deploy', version: '2.0.0' }),
    );

    const result = await MonorepoPkg.sync({
      cwd: fs.dir,
      source: { include: ['./code/**/deno.json', './deploy/**/deno.json'] },
    });

    expect(result.count).to.eql(2);
    expect(result.unchanged).to.eql(2);
    expect(result.packages.map((item) => item.packagePath)).to.eql([
      fs.join('code/projects/a'),
      fs.join('deploy/app'),
    ]);
  });

  it('ignores temp and fixture deno.json matches during discovery', async () => {
    const fs = await Testing.dir('MonorepoPkg.sync.discovery.exclude');

    await Fs.writeJson(fs.join('code/projects/a/deno.json'), {
      name: '@scope/a',
      version: '1.0.0',
    });
    await Fs.write(
      fs.join('code/projects/a/src/pkg.ts'),
      renderPkg({ name: '@scope/a', version: '1.0.0' }),
    );

    await Fs.writeJson(fs.join('code/projects/a/.tmp/foo/deno.json'), {
      name: '@scope/tmp',
      version: '9.9.9',
    });
    await Fs.writeJson(fs.join('code/projects/a/src/-test/sample/deno.json'), {
      name: '@scope/sample',
      version: '9.9.9',
    });

    const result = await MonorepoPkg.sync({
      cwd: fs.dir,
      source: { include: ['./code/**/deno.json'] },
    });

    expect(result.count).to.eql(1);
    expect(result.packages.map((item) => item.packagePath)).to.eql([fs.join('code/projects/a')]);
  });

  it('returns unchanged when existing canonical targets already match deno.json', async () => {
    const fs = await Testing.dir('MonorepoPkg.sync.unchanged');
    const dir = fs.join('code/projects/a');
    const text = renderPkg({ name: '@scope/a', version: '1.0.0' });

    await Fs.writeJson(fs.join('code/projects/a/deno.json'), {
      name: '@scope/a',
      version: '1.0.0',
    });
    await Fs.write(fs.join('code/projects/a/pkg.ts'), text);
    await Fs.write(fs.join('code/projects/a/src/pkg.ts'), text);

    const result = await MonorepoPkg.sync({
      cwd: fs.dir,
      source: { include: ['./code/**/deno.json'] },
    });

    expect(result.written).to.eql(0);
    expect(result.unchanged).to.eql(1);
    expect(result.skipped).to.eql(0);
    expect(result.touched).to.eql([Fs.join(dir, 'pkg.ts'), Fs.join(dir, 'src/pkg.ts')]);
    expect(result.packages[0]).to.eql({
      kind: 'unchanged',
      packagePath: dir,
      name: '@scope/a',
      version: '1.0.0',
      touched: [Fs.join(dir, 'pkg.ts'), Fs.join(dir, 'src/pkg.ts')],
    });
  });

  it('writes stale canonical targets from deno.json values', async () => {
    const fs = await Testing.dir('MonorepoPkg.sync.written');
    const dir = fs.join('code/projects/a');

    await Fs.writeJson(fs.join('code/projects/a/deno.json'), {
      name: '@scope/a',
      version: '1.2.3',
    });
    await Fs.write(
      fs.join('code/projects/a/src/pkg.ts'),
      renderPkg({ name: '@scope/a', version: '0.0.1' }),
    );

    const result = await MonorepoPkg.sync({
      cwd: fs.dir,
      source: { include: ['./code/**/deno.json'] },
    });

    expect(result.written).to.eql(1);
    expect(result.touched).to.eql([Fs.join(dir, 'src/pkg.ts')]);
    expect(result.packages[0]).to.eql({
      kind: 'written',
      packagePath: dir,
      name: '@scope/a',
      version: '1.2.3',
      touched: [Fs.join(dir, 'src/pkg.ts')],
    });
    expect((await Fs.readText(fs.join('code/projects/a/src/pkg.ts'))).data).to.eql(
      renderPkg({ name: '@scope/a', version: '1.2.3' }),
    );
  });

  it('skips packages with missing name or version', async () => {
    const fs = await Testing.dir('MonorepoPkg.sync.missing-meta');
    const missingName = fs.join('code/projects/missing-name');
    const missingVersion = fs.join('code/projects/missing-version');

    await Fs.writeJson(fs.join('code/projects/missing-name/deno.json'), { version: '1.0.0' });
    await Fs.write(fs.join('code/projects/missing-name/src/pkg.ts'), 'stale');

    await Fs.writeJson(fs.join('code/projects/missing-version/deno.json'), {
      name: '@scope/missing-version',
    });
    await Fs.write(fs.join('code/projects/missing-version/src/pkg.ts'), 'stale');

    const result = await MonorepoPkg.sync({
      cwd: fs.dir,
      source: { include: ['./code/**/deno.json'] },
    });

    expect(result.skipped).to.eql(2);
    expect(result.touched).to.eql([]);
    expect(result.packages).to.eql([
      {
        kind: 'skipped',
        packagePath: missingName,
        name: undefined,
        version: '1.0.0',
        touched: [],
        reason: 'missing-name',
      },
      {
        kind: 'skipped',
        packagePath: missingVersion,
        name: '@scope/missing-version',
        version: undefined,
        touched: [],
        reason: 'missing-version',
      },
    ]);
  });

  it('skips when no canonical target files exist', async () => {
    const fs = await Testing.dir('MonorepoPkg.sync.no-targets');
    const dir = fs.join('code/projects/a');

    await Fs.writeJson(fs.join('code/projects/a/deno.json'), {
      name: '@scope/a',
      version: '1.0.0',
    });

    const result = await MonorepoPkg.sync({
      cwd: fs.dir,
      source: { include: ['./code/**/deno.json'] },
    });

    expect(result.skipped).to.eql(1);
    expect(result.packages[0]).to.eql({
      kind: 'skipped',
      packagePath: dir,
      name: '@scope/a',
      version: '1.0.0',
      touched: [],
      reason: 'missing-target-files',
    });
  });

  it('syncs whichever canonical target files already exist', async () => {
    const fs = await Testing.dir('MonorepoPkg.sync.partial-targets');
    const dir = fs.join('deploy/app');

    await Fs.writeJson(fs.join('deploy/app/deno.json'), {
      name: '@scope/deploy',
      version: '3.0.0',
    });
    await Fs.write(fs.join('deploy/app/pkg.ts'), 'stale');

    const result = await MonorepoPkg.sync({
      cwd: fs.dir,
      source: { include: ['./deploy/**/deno.json'] },
    });

    expect(result.written).to.eql(1);
    expect(result.touched).to.eql([Fs.join(dir, 'pkg.ts')]);
    expect((await Fs.readText(fs.join('deploy/app/pkg.ts'))).data).to.eql(
      renderPkg({ name: '@scope/deploy', version: '3.0.0' }),
    );
  });
});
