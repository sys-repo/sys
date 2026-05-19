import { describe, expect, it, type t } from '../../-test.ts';
import { allowDocsPolicy, cmd, denyPrivatePolicy, expectFilesFsError, setup } from './u.fixture.ts';

describe('FilesFs.readonly: policy', () => {
  it('defaults to deny-all policy while keeping capabilities observable', async () => {
    const { backing } = setup();

    expect(await cmd.capabilities(backing)).to.eql({
      list: true,
      stat: true,
      read: true,
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

  it('allows readonly policy helper output without widening readonly backing authority', async () => {
    const { backing } = setup({ policy: allowDocsPolicy });

    expect(await cmd.capabilities(backing)).to.eql({
      list: true,
      stat: true,
      read: true,
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
