import { describe, expect, it } from '../../-test.ts';
import { TmplTesting } from '../mod.ts';
import { poisonVersions, readAuthorityFiles, readWorkspaceAuthorities, writeRepo } from './u.fixture.ts';

describe('m.testing/LocalRepoAuthorities', () => {
  it('read → reads generated repo imports.json and package.json', async () => {
    const root = await writeRepo();
    const authorities = await TmplTesting.LocalRepoAuthorities.read(root);
    const files = await readAuthorityFiles(root);

    expect(authorities.imports).to.eql(files.imports.imports);
    expect(authorities.packageJson).to.eql(files.packageJson);
  });

  it('rewrite → localizes generated repo authorities to workspace truth', async () => {
    const root = await writeRepo();
    await poisonVersions(root);
    const expected = await readWorkspaceAuthorities();

    const authorities = await TmplTesting.LocalRepoAuthorities.rewrite({ root });

    expect(authorities.imports['@sys/std'].includes('/code/sys/std/')).to.eql(true);
    expect(authorities.imports['@sys/tmpl'].includes('/code/-tmpl/')).to.eql(true);
    expect(authorities.imports.react).to.eql(expected.imports.react);
    expect(authorities.imports['react-dom/']).to.eql(expected.imports['react-dom/']);
    expect(authorities.packageJson.dependencies?.react).to.eql(expected.packageVersions.react);
    expect(authorities.packageJson.devDependencies?.vite).to.eql(expected.packageVersions.vite);
  });
});
