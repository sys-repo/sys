import { Process } from '@sys/process';

import { describe, expect, expectError, Fs, it, makeTmpl, Templates } from '../../-test.ts';
import { TmplTesting } from '../mod.ts';

describe(`@sys/tmpl/testing`, () => {
  it('API', async () => {
    const m = await import('@sys/tmpl/testing');
    expect(m.TmplTesting).to.equal(TmplTesting);
  });

  it('LocalRepoAuthorities.read → reads generated repo imports.json and package.json', async () => {
    const root = await writeRepo();
    const authorities = await TmplTesting.LocalRepoAuthorities.read(root);

    expect(authorities.imports['@sys/tmpl']).to.eql('jsr:@sys/tmpl@0.0.274');
    expect(authorities.packageJson.dependencies?.react).to.eql('19.2.4');
    expect(authorities.packageJson.devDependencies?.vite).to.eql('7.3.1');
  });

  it('LocalRepoAuthorities.rewrite → localizes generated repo authorities to workspace truth', async () => {
    const root = await writeRepo();
    await poisonVersions(root);

    const authorities = await TmplTesting.LocalRepoAuthorities.rewrite({ root });

    expect(authorities.imports['@sys/std'].includes('/code/sys/std/')).to.eql(true);
    expect(authorities.imports['@sys/tmpl'].includes('/code/-tmpl/')).to.eql(true);
    expect(authorities.imports['react']).to.eql('npm:react@19.2.4');
    expect(authorities.imports['react-dom/']).to.eql('npm:react-dom@19.2.4/');
    expect(authorities.packageJson.dependencies?.react).to.eql('19.2.4');
    expect(authorities.packageJson.devDependencies?.vite).to.eql('7.3.1');
  });

  it('LocalRepoFixture.create → create temp repo fixture → deno task ci passes', async () => {
    const fixture = await TmplTesting.LocalRepoFixture.create();

    const ci = await Process.invoke({
      cmd: 'deno',
      args: ['task', 'ci'],
      cwd: fixture.root,
      silent: true,
    });

    if (!ci.success) {
      throw new Error(
        `Localized repo fixture ci failed (code ${ci.code}).\n\nstdout:\n${ci.text.stdout}\n\nstderr:\n${ci.text.stderr}`,
      );
    }
  });

  it('LocalRepoFixture.create → dryRun requested → throw', async () => {
    await expectError(
      () => TmplTesting.LocalRepoFixture.create({ dryRun: true }),
      'does not support dryRun',
    );
  });
});

async function writeRepo() {
  const tmp = await Fs.makeTempDir({ prefix: 'tmpl.testing.repo.' });
  const root = tmp.absolute;

  const def = await Templates.repo();
  const tmpl = await makeTmpl('repo');
  await tmpl.write(root, { force: true });
  await def.default(root);

  return root;
}

async function poisonVersions(root: string) {
  const importsPath = Fs.join(root, 'imports.json');
  const packagePath = Fs.join(root, 'package.json');

  const imports = await readJson<{ readonly imports: Record<string, string> }>(importsPath);
  const packageJson = await readJson<{
    readonly dependencies?: Record<string, string>;
    readonly devDependencies?: Record<string, string>;
  }>(packagePath);

  const nextImports = structuredClone(imports);
  nextImports.imports['@sys/std'] = 'jsr:@sys/std@999.0.0';
  nextImports.imports['@sys/tmpl'] = 'jsr:@sys/tmpl@999.0.0';
  nextImports.imports.react = 'npm:react@0.0.1';
  nextImports.imports['react-dom/'] = 'npm:react-dom@0.0.1/';

  const nextPackage = structuredClone(packageJson);
  if (nextPackage.dependencies?.react) nextPackage.dependencies.react = '0.0.1';
  if (nextPackage.devDependencies?.vite) nextPackage.devDependencies.vite = '0.0.1';

  await Fs.writeJson(importsPath, nextImports);
  await Fs.writeJson(packagePath, nextPackage);
}

async function readJson<T>(path: string): Promise<T> {
  const res = await Fs.readJson(path);
  if (!res.ok || !res.data) throw new Error(`Failed to read JSON: ${path}`);
  return res.data as T;
}
