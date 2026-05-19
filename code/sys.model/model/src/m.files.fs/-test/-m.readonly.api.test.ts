import { describe, expect, expectTypeOf, it, type t } from '../../-test.ts';
import { allowDocsPolicy, cmd, setup } from './u.fixture.ts';

describe('FilesFs.readonly: API', () => {
  it('creates a bounded readonly backing without exposing the host root', async () => {
    const { backing } = setup({ policy: allowDocsPolicy, maxReadBytes: 64, defaultLimit: 2 });

    expect(backing.kind).to.eql('files/fs:readonly');
    expect(backing.policy).to.eql(allowDocsPolicy);
    expect(Object.isFrozen(backing.policy)).to.eql(true);
    expect(Object.isFrozen(backing.capabilities)).to.eql(true);
    expect(Object.isFrozen(backing.handlers)).to.eql(true);
    expect('root' in backing).to.eql(false);
    expect(Object.keys(backing.handlers).sort()).to.eql([
      'files:capabilities',
      'files:list',
      'files:manifest',
      'files:read',
      'files:stat',
      'files:watch',
    ]);
    expect(await cmd.capabilities(backing)).to.eql({
      list: true,
      stat: true,
      read: true,
      watch: false,
      manifest: true,
      maxReadBytes: 64,
      encodings: ['utf8'],
    });
    expectTypeOf(backing).toEqualTypeOf<t.FilesFs.Readonly>();
  });
});
