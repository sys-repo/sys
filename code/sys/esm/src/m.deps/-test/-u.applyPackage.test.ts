import { Deps, describe, expect, Fs, it, type t, Testing } from './common.ts';

describe('Deps.applyPackage', () => {
  it('projects package override policy into package.json', async () => {
    const fs = await Testing.dir('EsmDeps.applyPackage.overrides');
    const packagePath = fs.join('package.json');
    const entries = [
      Deps.toEntry('npm:react@19.2.6', { target: 'package.json' }),
      Deps.toEntry('npm:vite@7.3.2', { target: 'package.json', dev: true }),
    ];

    await Fs.writeJson(packagePath, {
      name: 'override-app',
      scripts: { dev: 'vite' },
      overrides: { stale: '0.0.1' },
    });

    const res = await Deps.applyPackage(packagePath, entries, {
      packageJson: {
        overrides: {
          '@automerge/automerge-repo': { uuid: '11.1.1' },
          'monaco-editor': { dompurify: '3.4.0' },
        },
      },
    });
    const packageFile = await Fs.readJson<t.PkgNodeJson>(packagePath);

    expect(res?.dependencies).to.eql({ react: '19.2.6' });
    expect(res?.devDependencies).to.eql({ vite: '7.3.2' });
    expect(res?.overrides).to.eql({
      '@automerge/automerge-repo': { uuid: '11.1.1' },
      'monaco-editor': { dompurify: '3.4.0' },
    });
    expect(packageFile.data).to.eql({
      name: 'override-app',
      scripts: { dev: 'vite' },
      dependencies: { react: '19.2.6' },
      devDependencies: { vite: '7.3.2' },
      overrides: {
        '@automerge/automerge-repo': { uuid: '11.1.1' },
        'monaco-editor': { dompurify: '3.4.0' },
      },
    });
  });

  it('removes stale generated overrides when no canonical policy exists', async () => {
    const fs = await Testing.dir('EsmDeps.applyPackage.removeOverrides');
    const packagePath = fs.join('package.json');
    const entries = [Deps.toEntry('npm:react@19.2.6', { target: 'package.json' })];

    await Fs.writeJson(packagePath, {
      name: 'override-app',
      overrides: { stale: '0.0.1' },
    });

    const res = await Deps.applyPackage(packagePath, entries);
    const packageFile = await Fs.readJson<t.PkgNodeJson>(packagePath);

    expect(res?.overrides).to.eql({});
    expect(packageFile.data).to.eql({
      name: 'override-app',
      dependencies: { react: '19.2.6' },
    });
  });
});
