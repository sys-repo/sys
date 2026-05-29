import { c, Cli, describe, expect, Fs, it, type t } from '../../-test.ts';
import {
  readUpgradeAdvisoryState,
  toRootUpgradeAdvisoryPrelude,
  writeUpgradeAdvisoryFailure,
  writeUpgradeAdvisorySuccess,
} from '../u.advisory.ts';
import { resolveUpgradeAdvisoryPath } from '../u.advisory.path.ts';
import { runUpgradeAdvisoryProbe } from '../u.advisory.probe.ts';

describe('cli.upgrade advisory', () => {
  it('resolves advisory path from XDG cache home', () => {
    const env = fixture.env({ XDG_CACHE_HOME: '/tmp/xdg', HOME: '/tmp/home' });
    const path = resolveUpgradeAdvisoryPath(env);
    expect(path).to.eql('/tmp/xdg/@sys.tools/advisory.json');
  });

  it('falls back to HOME cache when XDG cache home is unavailable', () => {
    const path = resolveUpgradeAdvisoryPath(fixture.env({ HOME: '/tmp/home' }));
    expect(path).to.eql('/tmp/home/.cache/@sys.tools/advisory.json');
  });

  it('disables advisory path resolution when no cache root is available', () => {
    const path = resolveUpgradeAdvisoryPath(fixture.env({}));
    expect(path).to.eql(undefined);
  });

  it('suppresses the pre-menu advisory when cached remote is not newer', () => {
    const text = toRootUpgradeAdvisoryPrelude({
      package: '@sys/tools',
      checkedAt: 1,
      ok: true,
      remote: '0.0.1',
    });

    expect(text).to.eql(undefined);
  });

  it('reads malformed advisory files fail-quiet', async () => {
    const tmp = await Fs.makeTempDir({ prefix: 'sys.tools.upgrade.advisory.malformed.' });
    const path = `${tmp.absolute}/advisory.json`;

    try {
      await Fs.write(path, '{nope');
      const res = await readUpgradeAdvisoryState({ path });
      expect(res.record).to.eql(undefined);
      expect(res.hasUpgrade).to.eql(false);
      expect(res.prelude).to.eql(undefined);
    } finally {
      await Fs.remove(tmp.absolute);
    }
  });

  it('debug remote env forces a pre-menu advisory block without persistence', async () => {
    const key = 'SYS_TOOLS_DEBUG_UPGRADE_ADVISORY_REMOTE';
    const before = Deno.env.get(key);

    try {
      Deno.env.set(key, '9.9.9');
      const res = await readUpgradeAdvisoryState();
      expect(res.path).to.eql(undefined);
      expect(res.hasUpgrade).to.eql(true);
      expect(res.record?.ok).to.eql(true);
      if (res.record?.ok) expect(res.record.remote).to.eql('9.9.9');
      expect(Cli.stripAnsi(res.prelude ?? '')).to.contain('sys upgrade --latest');
      expect(Cli.stripAnsi(res.prelude ?? '')).to.not.contain('Package');
    } finally {
      before === undefined ? Deno.env.delete(key) : Deno.env.set(key, before);
    }
  });

  it('derives a narrow pre-menu advisory block only when cached remote is newer', () => {
    const text = Cli.stripAnsi(
      toRootUpgradeAdvisoryPrelude({
        package: '@sys/tools',
        checkedAt: 1,
        ok: true,
        remote: '9.9.9',
      }) ?? '',
    );
    const lines = text.split('\n').filter(Boolean);

    expect(text).to.not.contain('Package');
    expect(text).to.not.contain('@sys/tools');
    expect(lines.length).to.eql(3);
    expect(lines[1]?.startsWith('Run sys upgrade --latest')).to.eql(true);
    expect(lines[1]?.endsWith('next available 9.9.9')).to.eql(true);
    expect(lines[1]?.length).to.eql(lines[0]?.length);
  });

  it('styles the pre-menu advisory command and next version with restrained emphasis', () => {
    const text = toRootUpgradeAdvisoryPrelude({
      package: '@sys/tools',
      checkedAt: 1,
      ok: true,
      remote: '9.9.9',
    }) ?? '';
    const lines = text.split('\n').filter(Boolean);
    const message = lines[1] ?? '';

    expect(
      message.startsWith(`${c.gray('Run ')}${c.white('sys upgrade ')}${c.magenta('--latest')}`),
    ).to.eql(true);
    expect(
      message.endsWith(`${c.gray('next available ')}${c.white('9.9.9')}`),
    ).to.eql(true);
  });

  it('writes and reads success advisory records', async () => {
    const tmp = await Fs.makeTempDir({ prefix: 'sys.tools.upgrade.advisory.success.' });
    const path = `${tmp.absolute}/advisory.json`;

    try {
      await writeUpgradeAdvisorySuccess('9.9.9', { path, now: fixture.now(12_345) });
      const res = await readUpgradeAdvisoryState({ path });

      expect(res.record).to.eql({
        package: '@sys/tools',
        checkedAt: 12_345,
        ok: true,
        remote: '9.9.9',
      });
      expect(res.hasUpgrade).to.eql(true);
      expect(Cli.stripAnsi(res.prelude ?? '')).to.contain('sys upgrade --latest');
    } finally {
      await Fs.remove(tmp.absolute);
    }
  });

  it('writes failure advisory records quietly', async () => {
    const tmp = await Fs.makeTempDir({ prefix: 'sys.tools.upgrade.advisory.failure.' });
    const path = `${tmp.absolute}/advisory.json`;

    try {
      await writeUpgradeAdvisoryFailure(new Error('network down'), { path, now: fixture.now(55) });
      const res = await readUpgradeAdvisoryState({ path });

      expect(res.record).to.eql({
        package: '@sys/tools',
        checkedAt: 55,
        ok: false,
        error: 'network down',
      });
      expect(res.hasUpgrade).to.eql(false);
      expect(res.prelude).to.eql(undefined);
    } finally {
      await Fs.remove(tmp.absolute);
    }
  });

  it('probe writes success advisory state from fetched version info', async () => {
    let written: string | undefined;
    const res = await runUpgradeAdvisoryProbe({
      getVersionInfo: async () => ({
        local: '0.0.1',
        remote: '0.0.2',
        latest: '0.0.2',
        is: { latest: false },
      }),
      writeSuccess: async (remote) => {
        written = remote;
      },
      writeFailure: async () => {
        throw new Error('should not write failure');
      },
    });

    expect(res).to.eql({ ok: true, remote: '0.0.2' });
    expect(written).to.eql('0.0.2');
  });

  it('probe keeps live success when advisory persistence fails', async () => {
    const res = await runUpgradeAdvisoryProbe({
      getVersionInfo: async () => ({
        local: '0.0.1',
        remote: '0.0.2',
        latest: '0.0.2',
        is: { latest: false },
      }),
      writeSuccess: async () => {
        throw new Error('cache unavailable');
      },
      writeFailure: async () => {
        throw new Error('should not write failure after live success');
      },
    });

    expect(res).to.eql({ ok: true, remote: '0.0.2' });
  });

  it('probe writes failure advisory state when live version fetch fails', async () => {
    let wroteFailure = false;
    const res = await runUpgradeAdvisoryProbe({
      getVersionInfo: async () => {
        throw new Error('boom');
      },
      writeSuccess: async () => {
        throw new Error('should not write success');
      },
      writeFailure: async () => {
        wroteFailure = true;
      },
    });

    expect(res).to.eql({ ok: false });
    expect(wroteFailure).to.eql(true);
  });
});

const fixture = {
  env(values: Record<string, string | undefined>) {
    return {
      get(key: string) {
        return values[key];
      },
    };
  },

  now(timestamp: t.UnixTimestamp) {
    return () => timestamp;
  },
} as const;
