import { describe, expect, expectTypeOf, it, type t } from '../../-test.ts';
import { Files } from '../../m.files/mod.ts';
import { allowDocsPolicy, cmd, expectFilesFsError, setup } from './u.fixture.ts';

const READONLY_SUPPORTS = {
  list: true,
  stat: true,
  read: true,
  manifest: true,
} satisfies Partial<t.Files.Capability.Map>;

describe('FilesFs.Readonly.create', () => {
  describe('surface', () => {
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
        'files:remove',
        'files:stat',
        'files:watch',
        'files:write',
      ]);
      expect(await cmd.capabilities(backing)).to.eql({
        list: true,
        stat: true,
        read: true,
        write: false,
        remove: false,
        watch: false,
        manifest: true,
        maxReadBytes: 64,
        encodings: ['utf8'],
      });
      expectTypeOf(backing).toEqualTypeOf<t.FilesFs.Readonly>();
    });
  });

  describe('authority', () => {
    it('derives readonly capability truth from Files.Authority', async () => {
      const { backing } = setup({ policy: allowDocsPolicy, maxReadBytes: 64 });
      const authority = Files.Authority.resolve({
        policy: backing.policy,
        backing: {
          supports: READONLY_SUPPORTS,
          maxReadBytes: 64,
          encodings: ['utf8'],
        },
      });

      expect(backing.capabilities).to.eql(authority.capabilities);
      expect(await cmd.capabilities(backing)).to.eql(authority.capabilities);

      const manifest = await cmd.manifest(backing, { path: 'docs' });
      expect(manifest['.meta'].capabilities).to.eql(authority.capabilities);

      await expectFilesFsError(
        () => cmd.write(backing, null as never),
        'FilesFsError.Unsupported',
      );
    });
  });
});
