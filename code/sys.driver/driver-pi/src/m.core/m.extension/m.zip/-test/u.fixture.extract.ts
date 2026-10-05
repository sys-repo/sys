import { Fs } from '@sys/fs';
import { FsCapability } from '@sys/fs/capability';
import { ArchiveFixture, type t } from './common.ts';
import { withRoot } from './u.fixture.ts';

/** One deflated file, its implicit parent, and an empty file exercise owned tree construction. */
export async function withArchive(run: (root: string) => Promise<void>) {
  await withRoot(async (root) => {
    await Fs.write(
      Fs.join(root, 'a.zip'),
      ArchiveFixture.zip([{ name: 'deep/a.txt', data: 'hello', method: 8 }, { name: 'empty' }])
        .bytes,
      { throw: true },
    );
    await run(root);
  });
}

/** Decorate actual Rooted instances; each test keeps its caller-seam intervention visible. */
export function withRooted(
  wrap: (actual: t.FsRooted.Instance) => t.FsRooted.Instance,
): t.FsRooted.Lib {
  return {
    ...FsCapability.Rooted,
    async create(options) {
      return wrap(await FsCapability.Rooted.create(options));
    },
  };
}

/** An authenticated admission failure for caller-seam presentation tests, not a native IO fault. */
export async function rootedFailure(root: string): Promise<t.FsRooted.Failure> {
  const rooted = await FsCapability.Rooted.create({ root });
  try {
    await rooted.Target.admit([{ kind: 'directory', path: '../escape' }]);
  } catch (error) {
    if (FsCapability.Rooted.Is.failure(error)) return error;
    throw error;
  }
  throw new Error('Expected authenticated Rooted failure');
}
