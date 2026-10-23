import { describe, expect, it, type t } from '../../-test.ts';
import { allowDocsPolicy, cmd, denyPrivatePolicy, expectFilesFsError, setup } from './u.fixture.ts';

describe('FilesFs.Readonly.create: policy', () => {
  describe('authority', () => {
    it('defaults to deny-all policy while keeping capabilities observable', async () => {
      const { backing } = setup();

      expect(await cmd.capabilities(backing)).to.eql({
        list: true,
        stat: true,
        read: true,
        write: false,
        remove: false,
        watch: false,
        manifest: false,
        encodings: ['utf8'],
      });

      await expectFilesFsError(
        () => cmd.list(backing, { path: 'docs' }),
        'FilesFsError.PolicyDenied',
      );
      await expectFilesFsError(
        () => cmd.stat(backing, { path: 'docs/readme.md' }),
        'FilesFsError.PolicyDenied',
      );
      await expectFilesFsError(
        () => cmd.read(backing, { path: 'docs/readme.md' }),
        'FilesFsError.PolicyDenied',
      );
      await expectFilesFsError(
        () => cmd.manifest(backing, { path: 'docs' }),
        'FilesFsError.PolicyDenied',
      );
    });

    it('keeps manifest disabled unless policy explicitly enables it', async () => {
      const policy = {
        list: 'docs/**',
        stat: 'docs/**',
        read: 'docs/**',
      } satisfies t.Files.Policy.Shape;
      const { backing } = setup({ policy });

      expect(await cmd.capabilities(backing)).to.eql({
        list: true,
        stat: true,
        read: true,
        write: false,
        remove: false,
        watch: false,
        manifest: false,
        encodings: ['utf8'],
      });
      await expectFilesFsError(
        () => cmd.manifest(backing, { path: 'docs' }),
        'FilesFsError.PolicyDenied',
      );
    });

    it('lets deny rules override allow rules for list/stat/read surfaces', async () => {
      const { backing } = setup({ policy: denyPrivatePolicy });

      const list = await cmd.list(backing, { path: 'docs' });
      expect(list.entries.map((entry) => entry.path)).to.eql([
        'docs/nested',
        'docs/nested/guide.md',
        'docs/readme.md',
      ]);

      await expectFilesFsError(
        () => cmd.stat(backing, { path: 'docs/private/secret.md' }),
        'FilesFsError.PolicyDenied',
      );
      await expectFilesFsError(
        () => cmd.read(backing, { path: 'docs/private/secret.md' }),
        'FilesFsError.PolicyDenied',
      );
    });

    it('snapshots policy and capabilities so caller mutation cannot widen authority', async () => {
      const allow = ['docs/**'];
      const policy = {
        list: allow,
        stat: allow,
        read: allow,
        manifest: true,
      } satisfies t.Files.Policy.Shape;
      const { backing } = setup({ policy });

      allow.push('public/**');
      (policy as Record<string, unknown>).read = '**';

      expect(Object.isFrozen(backing.policy)).to.eql(true);
      expect(Object.isFrozen(backing.capabilities)).to.eql(true);
      expect(Object.isFrozen(backing.capabilities.encodings)).to.eql(true);
      expect(await cmd.capabilities(backing)).to.eql({
        list: true,
        stat: true,
        read: true,
        write: false,
        remove: false,
        watch: false,
        manifest: true,
        encodings: ['utf8'],
      });
      await expectFilesFsError(
        () => cmd.read(backing, { path: 'public/info.txt' }),
        'FilesFsError.PolicyDenied',
      );
    });
  });

  describe('safety', () => {
    it('rejects invalid policy shapes at creation', async () => {
      await expectFilesFsError(
        () => setup({ policy: null as never }),
        'FilesFsError.InvalidPath',
      );
      await expectFilesFsError(
        () => setup({ policy: new Map() as never }),
        'FilesFsError.InvalidPath',
      );
      await expectFilesFsError(
        () => setup({ policy: { read: 123 as never } }),
        'FilesFsError.InvalidPath',
      );
      await expectFilesFsError(
        () => setup({ policy: { list: ['docs/**', 123] as never } }),
        'FilesFsError.InvalidPath',
      );
      await expectFilesFsError(
        () => setup({ policy: { manifest: 'true' as never } }),
        'FilesFsError.InvalidPath',
      );
    });
  });
});
