import { Process } from '@sys/process';

import { describe, expect, expectError, Fs, it } from '../../-test.ts';
import { Fmt } from '../../-tests/u.ts';
import { TmplTesting } from '../mod.ts';
import { readAuthorityFiles } from './u.fixture.ts';

describe('m.testing/LocalRepoFixture', () => {
  it('create → create temp repo fixture → deno task ci passes', async () => {
    console.info(Fmt.slowRepoWorkspaceNote());
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
    console.info(Fmt.slowRepoWorkspaceNote());
    const captured = await captureInfoAndWarn(() =>
      TmplTesting.LocalRepoFixture.create({ silent: true })
    );
    const fixture = captured.value;

    expect(captured.info).to.eql([]);
    expect(captured.warn).to.eql([]);
    expect(await Fs.exists(Fs.join(fixture.root, 'deno.json'))).to.eql(true);
    const files = await readAuthorityFiles(fixture.root);
    expect(files.imports.imports).to.eql(fixture.authorities.imports);
    expect(files.packageJson).to.eql(fixture.authorities.packageJson);

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

async function captureInfoAndWarn<T>(run: () => Promise<T>) {
  const original = { info: console.info, warn: console.warn } as const;
  const calls = {
    info: [] as unknown[][],
    warn: [] as unknown[][],
  };

  console.info = (...args: unknown[]) => {
    calls.info.push(args);
  };
  console.warn = (...args: unknown[]) => {
    calls.warn.push(args);
  };

  try {
    const value = await run();
    return { value, info: calls.info, warn: calls.warn } as const;
  } finally {
    console.info = original.info;
    console.warn = original.warn;
  }
}
