import { type t, describe, expect, Fs, it, Testing } from '../../../-test.ts';
import { DenoFile } from '../../m.DenoFile/mod.ts';
import { DenoDeps } from '../mod.ts';

describe('DenoDeps.applyFiles', () => {
  it('writes deps.yaml and projected deno imports together', async () => {
    const fs = await Testing.dir('DenoDeps.applyFiles');
    const depsPath = fs.join('deps.yaml');
    const denoPath = fs.join('deno.json');
    const packagePath = fs.join('package.json');
    const deps = [
      DenoDeps.toDep('jsr:@std/path@1.0.8', { target: 'deno.json' }),
      DenoDeps.toDep('npm:react@19.0.0', { target: 'deno.json' }),
      DenoDeps.toDep('npm:react@19.0.0', { target: 'package.json' }),
      DenoDeps.toDep('npm:react-dom@19.0.0', { target: 'package.json' }),
      DenoDeps.toDep('npm:vite@7.3.1', { target: 'package.json', dev: true }),
    ];

    await Fs.writeJson(denoPath, { name: 'upgrade-app', tasks: { dev: 'deno task dev' } });
    await Fs.writeJson(packagePath, {
      name: 'upgrade-app',
      scripts: { dev: 'vite' },
      dependencies: { react: '18.2.0' },
      devDependencies: { vite: '6.0.0' },
    });

    const res = await DenoDeps.applyFiles(
      { depsPath, denoFilePath: denoPath, packageFilePath: packagePath },
      deps,
    );
    const depsFile = await Fs.readText(depsPath);
    const denoFile = await DenoFile.load(denoPath);
    const packageFile = await Fs.readJson<t.PkgNodeJson>(packagePath);

    expect(res.package).to.not.eql(undefined);
    if (!res.package) throw new Error('Expected package result');
    expect(res.yaml.depsFilePath).to.eql(depsPath);
    expect(res.deno.denoFilePath).to.eql(denoPath);
    expect(res.package.packageFilePath).to.eql(packagePath);
    expect(depsFile.data).to.eql(res.yaml.yaml.text);
    expect(denoFile.data?.imports).to.eql({
      '@std/path': 'jsr:@std/path@1.0.8',
      react: 'npm:react@19.0.0',
    });
    expect(denoFile.data?.tasks).to.eql({ dev: 'deno task dev' });
    expect(packageFile.data?.dependencies).to.eql({
      react: '19.0.0',
      'react-dom': '19.0.0',
    });
    expect(packageFile.data?.devDependencies).to.eql({
      vite: '7.3.1',
    });
    expect(packageFile.data?.scripts).to.eql({ dev: 'vite' });
  });

  it('preserves dependency subpaths when applying files', async () => {
    const fs = await Testing.dir('DenoDeps.applyFiles.subpaths');
    const depsPath = fs.join('deps.yaml');
    const denoPath = fs.join('deno.json');
    const deps = [
      DenoDeps.toDep('jsr:@std/path@1.1.4', {
        target: 'deno.json',
        subpaths: ['join', 'posix/join', 'windows/join'],
      }),
      DenoDeps.toDep('npm:hono@4.12.9', {
        target: 'deno.json',
        subpaths: ['cors'],
      }),
    ];

    await Fs.writeJson(denoPath, { name: 'upgrade-subpaths-app', tasks: { dev: 'deno task dev' } });

    const res = await DenoDeps.applyFiles({ depsPath, denoFilePath: denoPath }, deps);
    const depsFile = await Fs.readText(depsPath);
    const denoFile = await DenoFile.load(denoPath);
    const parsed = await DenoDeps.from(depsFile.data ?? '');

    expect(depsFile.data).to.eql(res.yaml.yaml.text);
    expect(depsFile.data).to.include('subpaths:');
    expect(parsed.error).to.eql(undefined);
    expect(parsed.data?.deps.map((dep) => ({
      module: dep.module.toString(),
      target: dep.target,
      subpaths: dep.subpaths,
    }))).to.eql([
      {
        module: 'jsr:@std/path@1.1.4',
        target: ['deno.json'],
        subpaths: ['join', 'posix/join', 'windows/join'],
      },
      {
        module: 'npm:hono@4.12.9',
        target: ['deno.json'],
        subpaths: ['cors'],
      },
    ]);
    expect(denoFile.data?.imports).to.eql({
      '@std/path': 'jsr:@std/path@1.1.4',
      '@std/path/join': 'jsr:@std/path@1.1.4/join',
      '@std/path/posix/join': 'jsr:@std/path@1.1.4/posix/join',
      '@std/path/windows/join': 'jsr:@std/path@1.1.4/windows/join',
      hono: 'npm:hono@4.12.9',
      'hono/cors': 'npm:hono@4.12.9/cors',
    });
  });

  it('does not write package.json unless a package target is explicitly provided', async () => {
    const fs = await Testing.dir('DenoDeps.applyFiles.noPackage');
    const depsPath = fs.join('deps.yaml');
    const denoPath = fs.join('deno.json');
    const packagePath = fs.join('package.json');
    const deps = [
      DenoDeps.toDep('jsr:@std/path@1.0.8', { target: 'deno.json' }),
      DenoDeps.toDep('npm:react@19.0.0', { target: 'package.json' }),
    ];

    await Fs.writeJson(denoPath, { name: 'upgrade-app', tasks: { dev: 'deno task dev' } });

    const res = await DenoDeps.applyFiles({ depsPath, denoFilePath: denoPath }, deps);

    expect(res.package).to.eql(undefined);
    expect(await Fs.exists(packagePath)).to.eql(false);
  });
});
