import { describe, expect, it } from '../../-test.ts';
import { TmplTesting } from '../mod.ts';
import { readAuthorityFiles, writeRepo } from './u.fixture.ts';

describe('m.testing/LocalRepoAuthorities', () => {
  it('read → reads generated repo imports.json and package.json', async () => {
    const root = await writeRepo();
    const authorities = await TmplTesting.LocalRepoAuthorities.read(root);
    const files = await readAuthorityFiles(root);

    expect(authorities.imports).to.eql(files.imports.imports);
    expect(authorities.packageJson).to.eql(files.packageJson);
  });
});
