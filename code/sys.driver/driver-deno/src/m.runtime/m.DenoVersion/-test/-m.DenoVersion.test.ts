import { describe, expect, it } from '../../../-test.ts';
import { detect } from '../u.authority.ts';
import { get } from '../u.current.ts';
import { run } from '../u.upgrade.run.ts';
import { status } from '../u.upgrade.status.ts';
import { procOutput } from './u.fixture.ts';

describe('m.DenoVersion', () => {
  it('Current.get invokes `deno --version` and returns the parsed version', async () => {
    const calls: Array<{ cmd?: string; args?: string[] }> = [];
    const res = await get({ cmd: 'deno-custom' }, {
      invoke: async (input) => {
        calls.push({ cmd: input.cmd, args: input.args });
        return procOutput([
          'deno 2.7.13 (stable, release, aarch64-apple-darwin)',
          'v8 14.7.173.20-rusty',
          'typescript 5.9.2',
        ].join('\n'));
      },
    });

    expect(calls).to.eql([{ cmd: 'deno-custom', args: ['--version'] }]);
    expect(res.ok).to.eql(true);
    if (!res.ok) return;
    expect(res.data.version).to.eql('2.7.13');
    expect(res.data.output.cmd).to.eql('deno-custom');
  });

  it('Upgrade.status invokes `deno upgrade --dry-run`', async () => {
    const calls: Array<{ args?: string[] }> = [];
    const res = await status({}, {
      invoke: async (input) => {
        calls.push({ args: input.args });
        return procOutput([
          'Current Deno version: v2.7.13',
          'Looking up stable version',
          '',
          'Local deno version 2.7.13 is the most recent release',
        ].join('\n'));
      },
    });

    expect(calls).to.eql([{ args: ['upgrade', '--dry-run'] }]);
    expect(res.ok).to.eql(true);
    if (!res.ok) return;
    expect(res.data.needed).to.eql(false);
    expect(res.data.latest).to.eql('2.7.13');
  });

  it('Upgrade.run expands composite targets such as `pr 12345`', async () => {
    const calls: Array<{ args?: string[] }> = [];
    const res = await run({ dryRun: true, target: 'pr 12345' }, {
      invoke: async (input) => {
        calls.push({ args: input.args });
        return procOutput([
          'Current Deno version: v2.7.13',
          'Deno is upgrading to version 2.7.14',
          'Upgraded successfully (dry run)',
        ].join('\n'));
      },
    });

    expect(calls).to.eql([{ args: ['upgrade', '--dry-run', 'pr', '12345'] }]);
    expect(res.ok).to.eql(true);
    if (!res.ok) return;
    expect(res.data.from).to.eql('2.7.13');
    expect(res.data.to).to.eql('2.7.14');
    expect(res.data.dryRun).to.eql(true);
  });

  it('Authority.detect resolves the runtime upgrade authority', async () => {
    const res = await detect({ cmd: 'deno-custom' }, {
      which: async () => procOutput('/opt/homebrew/bin/deno\n'),
      realPath: async () => '/opt/homebrew/Cellar/deno/2.7.13/bin/deno',
      home: () => '/Users/tester',
      execPath: () => '/ignored',
    });

    expect(res.ok).to.eql(true);
    if (!res.ok) return;
    expect(res.data.kind).to.eql('brew');
    expect(res.data.path).to.eql('/opt/homebrew/Cellar/deno/2.7.13/bin/deno');
  });

  it('returns a typed failure when command output cannot be parsed', async () => {
    const res = await get({}, {
      invoke: async () => procOutput('not deno output'),
    });

    expect(res.ok).to.eql(false);
    if (res.ok) return;
    expect(res.output?.cmd).to.eql('deno');
    expect(res.error.message).to.contain('could not be parsed');
  });
});
