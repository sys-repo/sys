import { describe, it } from '../../-test.ts';
import { allowDocsPolicy, cmd, expectFilesFsError, setup } from './u.fixture.ts';

describe('FilesFs.Readonly.create: watch', () => {
  it('rejects unsupported watch commands', async () => {
    const { backing } = setup({ policy: allowDocsPolicy });

    await expectFilesFsError(
      () => cmd.watch(backing, { path: 'docs' }),
      'FilesFsError.Unsupported',
    );
  });
});
