import { describe, expect, it, type t } from '../../-test.ts';
import {
  allowAllPolicy,
  cmd,
  escapingFixture,
  expectFilesFsError,
  file,
  type FsFixtureOptions,
  setup,
} from './u.fixture.ts';

describe('FilesFs.Readonly.create: symlink containment', () => {
  describe('direct containment', () => {
    it('rejects file symlink escapes before target stat/read IO', async () => {
      const statCase = setup({ fs: escapingFixture(), policy: allowAllPolicy });
      await expectFilesFsError(
        () => cmd.stat(statCase.backing, { path: 'link-out.txt' }),
        'FilesFsError.PathOutsideRoot',
      );
      expect(statCase.calls.stat).to.eql(0);
      expect(statCase.calls.readText).to.eql(0);

      const readCase = setup({ fs: escapingFixture(), policy: allowAllPolicy });
      await expectFilesFsError(
        () => cmd.read(readCase.backing, { path: 'link-out.txt' }),
        'FilesFsError.PathOutsideRoot',
      );
      expect(readCase.calls.stat).to.eql(0);
      expect(readCase.calls.readText).to.eql(0);
    });

    it('rejects directory symlink escapes before list/manifest traversal', async () => {
      const listCase = setup({ fs: escapingDirectoryFixture(), policy: allowAllPolicy });
      await expectFilesFsError(
        () => cmd.list(listCase.backing, { path: 'link-out-dir' }),
        'FilesFsError.PathOutsideRoot',
      );
      expect(listCase.calls.stat).to.eql(0);
      expect(listCase.calls.walk).to.eql(0);

      const manifestCase = setup({ fs: escapingDirectoryFixture(), policy: allowAllPolicy });
      await expectFilesFsError(
        () => cmd.manifest(manifestCase.backing, { path: 'link-out-dir' }),
        'FilesFsError.PathOutsideRoot',
      );
      expect(manifestCase.calls.stat).to.eql(0);
      expect(manifestCase.calls.walk).to.eql(0);
    });
  });

  describe('walk containment', () => {
    it('rejects discovered symlink escapes before list/manifest can return entries', async () => {
      const listCase = setup({ fs: escapingFixture(), policy: allowAllPolicy });
      await expectFilesFsError(
        () => cmd.list(listCase.backing),
        'FilesFsError.PathOutsideRoot',
      );
      expect(listCase.calls.walk).to.eql(1);
      expect(listCase.calls.readText).to.eql(0);

      const manifestCase = setup({ fs: escapingFixture(), policy: allowAllPolicy });
      await expectFilesFsError(
        () => cmd.manifest(manifestCase.backing),
        'FilesFsError.PathOutsideRoot',
      );
      expect(manifestCase.calls.walk).to.eql(1);
      expect(manifestCase.calls.readText).to.eql(0);
    });

    it('rejects sibling-prefix real-path escapes', async () => {
      const statCase = setup({ fs: escapingSiblingPrefixFixture(), policy: allowAllPolicy });
      await expectFilesFsError(
        () => cmd.stat(statCase.backing, { path: 'link-prefix.txt' }),
        'FilesFsError.PathOutsideRoot',
      );
      expect(statCase.calls.stat).to.eql(0);

      const listCase = setup({ fs: escapingSiblingPrefixFixture(), policy: allowAllPolicy });
      await expectFilesFsError(
        () => cmd.list(listCase.backing),
        'FilesFsError.PathOutsideRoot',
      );
      expect(listCase.calls.walk).to.eql(1);
    });
  });
});

/**
 * Helpers:
 */

function escapingDirectoryFixture(): FsFixtureOptions {
  return {
    nodes: {
      '/root/link-out-dir': { kind: 'dir' },
      '/outside': { kind: 'dir' },
      '/outside/secret.txt': file('secret', 'text/plain'),
    },
    realPaths: {
      '/root/link-out-dir': '/outside' as t.StringAbsolutePath,
    },
  };
}

function escapingSiblingPrefixFixture(): FsFixtureOptions {
  return {
    nodes: {
      '/root/link-prefix.txt': file('secret', 'text/plain'),
      '/root-escape': { kind: 'dir' },
      '/root-escape/secret.txt': file('secret', 'text/plain'),
    },
    realPaths: {
      '/root/link-prefix.txt': '/root-escape/secret.txt' as t.StringAbsolutePath,
    },
  };
}
