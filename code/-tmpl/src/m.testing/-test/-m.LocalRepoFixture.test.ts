import { Process } from '@sys/process';

import { describe, expectError, it } from '../../-test.ts';
import { TmplTesting } from '../mod.ts';

describe('m.testing/LocalRepoFixture', () => {
  it('create → create temp repo fixture → deno task ci passes', async () => {
    const fixture = await TmplTesting.LocalRepoFixture.create();

    const ci = await Process.invoke({
      cmd: 'deno',
      args: ['task', 'ci'],
      cwd: fixture.root,
      silent: true,
    });

    if (!ci.success) {
      throw new Error(
        `Localized repo fixture ci failed (code ${ci.code}).\n\nstdout:\n${ci.text.stdout}\n\nstderr:\n${ci.text.stderr}`,
      );
    }
  });

  it('create → silent fixture → deno task ci passes', async () => {
    const fixture = await TmplTesting.LocalRepoFixture.create({ silent: true });

    const ci = await Process.invoke({
      cmd: 'deno',
      args: ['task', 'ci'],
      cwd: fixture.root,
      silent: true,
    });

    if (!ci.success) {
      throw new Error(
        `Silent localized repo fixture ci failed (code ${ci.code}).\n\nstdout:\n${ci.text.stdout}\n\nstderr:\n${ci.text.stderr}`,
      );
    }
  });

  it('create → dryRun requested → throw', async () => {
    await expectError(
      () => TmplTesting.LocalRepoFixture.create({ dryRun: true }),
      'does not support dryRun',
    );
  });
});
