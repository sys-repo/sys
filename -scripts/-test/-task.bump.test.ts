import { describe, expect, it } from '@sys/testing/server';
import { main } from '../task.bump.ts';
import { postBumpPackageSyncArgs, postBumpPrepArgs } from '../task.bump.policy.ts';

describe('scripts/task.bump', () => {
  it('syncs package metadata before delegating to the canonical ahead-only prep lane', () => {
    expect(postBumpPackageSyncArgs()).to.eql([
      'run',
      '-P=dev',
      './-scripts/main.ts',
      '--prep-pkg',
    ]);
    expect(postBumpPrepArgs()).to.eql([
      'run',
      '-P=dev',
      './-scripts/main.ts',
      '--prep-all',
      '--ahead-only',
      '--prep-context=bump',
    ]);
  });

  it('renders bump help with release and from options', async () => {
    const calls: string[] = [];
    const info = console.info;
    console.info = (...args: unknown[]) => calls.push(String(args[0] ?? ''));

    try {
      await main({ argv: ['--help'] });
    } finally {
      console.info = info;
    }

    const output = calls.join('\n');
    expect(output).to.include('deno task bump');
    expect(output).to.include('--release <patch|minor|major>');
    expect(output).to.include('--from <package-name|package-path>');
  });
});
