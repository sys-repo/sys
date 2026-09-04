import { describe, expect, it, type t } from '../../-test.ts';
import { Files } from '../../m.files/mod.ts';
import { allowDocsPolicy, cmd, expectFilesFsError, setup } from './u.fixture.ts';

describe('FilesFs.Readonly.create: read', () => {
  describe('read limits', () => {
    it('enforces the strictest read byte limit and prevents payload widening', async () => {
      const policy = Files.Policy.readonly('big.txt', { maxReadBytes: 4 });
      const large = setup({ policy, maxReadBytes: 6 });

      expect(await cmd.capabilities(large.backing)).to.eql({
        list: true,
        stat: true,
        read: true,
        write: false,
        remove: false,
        watch: false,
        manifest: true,
        maxReadBytes: 4,
        encodings: ['utf8'],
      });

      await expectFilesFsError(
        () => cmd.read(large.backing, { path: 'big.txt', maxBytes: 10 }),
        'FilesFsError.ReadTooLarge',
      );
      expect(large.calls.readText).to.eql(0);

      const narrowed = setup({ policy: allowDocsPolicy, maxReadBytes: 64 });
      await expectFilesFsError(
        () => cmd.read(narrowed.backing, { path: 'docs/readme.md', maxBytes: 4 }),
        'FilesFsError.ReadTooLarge',
      );
      expect(narrowed.calls.readText).to.eql(0);
    });
  });

  describe('safety', () => {
    it('rejects unsupported read encodings before host stat/read IO', async () => {
      const { backing, calls } = setup({ policy: allowDocsPolicy });

      await expectFilesFsError(
        () => cmd.read(backing, { path: 'docs/readme.md', encoding: 'utf16' }),
        'FilesFsError.Unsupported',
      );
      expect(calls.stat).to.eql(0);
      expect(calls.readText).to.eql(0);
    });

    it('rejects invalid read limits before host stat/read IO', async () => {
      await expectFilesFsError(
        () => setup({ policy: allowDocsPolicy, maxReadBytes: -1 }),
        'FilesFsError.InvalidPath',
      );
      await expectFilesFsError(
        () => setup({ policy: { ...allowDocsPolicy, maxReadBytes: Number.POSITIVE_INFINITY } }),
        'FilesFsError.InvalidPath',
      );

      const invalidPayload = setup({ policy: allowDocsPolicy });
      await expectFilesFsError(
        () => cmd.read(invalidPayload.backing, { path: 'docs/readme.md', maxBytes: -1 }),
        'FilesFsError.InvalidPath',
      );
      expect(invalidPayload.calls.stat).to.eql(0);
      expect(invalidPayload.calls.readText).to.eql(0);
    });

    it('rejects missing read paths before host stat/read IO', async () => {
      const { backing, calls } = setup({ policy: allowDocsPolicy });

      await expectFilesFsError(
        () => cmd.read(backing, {} as t.Files.Cmd.Read.Payload),
        'FilesFsError.InvalidPath',
      );
      expect(calls.stat).to.eql(0);
      expect(calls.readText).to.eql(0);
    });
  });
});
