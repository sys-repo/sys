import { c, Cli, describe, expect, Fs, it, pkg, type t } from '../../-test.ts';
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

  it('suppresses the pre-menu advisory when cached actionable version is not newer', () => {
    const text = toRootUpgradeAdvisoryPrelude({
      schemaVersion: 2,
      package: '@sys/tools',
      checkedAt: 1,
      ok: true,
      local: '0.0.1',
      published: '0.0.1',
      actionable: '0.0.1',
      status: 'none',
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

  it('ignores old remote-only advisory records fail-quiet', async () => {
    const tmp = await Fs.makeTempDir({ prefix: 'sys.tools.upgrade.advisory.v1.' });
    const path = `${tmp.absolute}/advisory.json`;

    try {
      await Fs.write(path, '{"package":"@sys/tools","checkedAt":1,"ok":true,"remote":"9.9.9"}');
      const res = await readUpgradeAdvisoryState({ path });
      expect(res.record).to.eql(undefined);
      expect(res.hasUpgrade).to.eql(false);
      expect(res.prelude).to.eql(undefined);
    } finally {
      await Fs.remove(tmp.absolute);
    }
  });

  it('expires cached upgrade advisories once the actionable version is adopted', async () => {
    const tmp = await Fs.makeTempDir({ prefix: 'sys.tools.upgrade.advisory.adopted.' });
    const path = `${tmp.absolute}/advisory.json`;

    try {
      await Fs.writeJson(path, {
        schemaVersion: 2,
        package: '@sys/tools',
        checkedAt: 1,
        ok: true,
        local: '0.0.0',
        published: pkg.version,
        actionable: pkg.version,
        status: 'upgrade-available',
      });
      const res = await readUpgradeAdvisoryState({ path });

      expect(res.record).to.eql(undefined);
      expect(res.hasUpgrade).to.eql(false);
      expect(res.prelude).to.eql(undefined);
    } finally {
      await Fs.remove(tmp.absolute);
    }
  });

  it('expires cached pending advisories once the published version is adopted', async () => {
    const tmp = await Fs.makeTempDir({ prefix: 'sys.tools.upgrade.advisory.pending.adopted.' });
    const path = `${tmp.absolute}/advisory.json`;

    try {
      await Fs.writeJson(path, {
        schemaVersion: 2,
        package: '@sys/tools',
        checkedAt: 1,
        ok: true,
        local: '0.0.0',
        published: pkg.version,
        actionable: '0.0.0',
        status: 'pending',
        reason: { code: 'policy:minimum-dependency-age' },
      });
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
      if (res.record?.ok) {
        expect(res.record.published).to.eql('9.9.9');
        expect(res.record.actionable).to.eql('9.9.9');
        expect(res.record.status).to.eql('upgrade-available');
      }
      expect(Cli.stripAnsi(res.prelude ?? '')).to.contain('sys upgrade --latest');
      expect(Cli.stripAnsi(res.prelude ?? '')).to.not.contain('Package');
    } finally {
      before === undefined ? Deno.env.delete(key) : Deno.env.set(key, before);
    }
  });

  it('derives a narrow pre-menu advisory block only when cached actionable version is newer', () => {
    const text = Cli.stripAnsi(
      toRootUpgradeAdvisoryPrelude({
        schemaVersion: 2,
        package: '@sys/tools',
        checkedAt: 1,
        ok: true,
        local: '0.0.1',
        published: '9.9.9',
        actionable: '9.9.9',
        status: 'upgrade-available',
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

  it('styles the pre-menu advisory action with green command emphasis', () => {
    const text = toRootUpgradeAdvisoryPrelude({
      schemaVersion: 2,
      package: '@sys/tools',
      checkedAt: 1,
      ok: true,
      local: '0.0.1',
      published: '9.9.9',
      actionable: '9.9.9',
      status: 'upgrade-available',
    }) ?? '';
    const lines = text.split('\n').filter(Boolean);
    const message = lines[1] ?? '';

    expect(
      message.startsWith(`${c.gray('Run ')}${c.white('sys upgrade ')}${c.green('--latest')}`),
    ).to.eql(true);
    expect(
      message.endsWith(`${c.gray('next available ')}${c.white('9.9.9')}`),
    ).to.eql(true);
  });

  it('writes and reads actionable success advisory records', async () => {
    const tmp = await Fs.makeTempDir({ prefix: 'sys.tools.upgrade.advisory.success.' });
    const path = `${tmp.absolute}/advisory.json`;

    try {
      await writeUpgradeAdvisorySuccess(
        {
          local: '0.0.1',
          remote: '9.9.9',
          latest: '9.9.9',
          actionable: '9.9.9',
          is: { latest: false, upgradeAvailable: true, pending: false },
        },
        { path, now: fixture.now(12_345) },
      );
      const res = await readUpgradeAdvisoryState({ path });

      expect(res.record).to.eql({
        schemaVersion: 2,
        package: '@sys/tools',
        checkedAt: 12_345,
        ok: true,
        local: '0.0.1',
        published: '9.9.9',
        actionable: '9.9.9',
        status: 'upgrade-available',
      });
      expect(res.hasUpgrade).to.eql(true);
      expect(Cli.stripAnsi(res.prelude ?? '')).to.contain('sys upgrade --latest');
    } finally {
      await Fs.remove(tmp.absolute);
    }
  });

  it('writes pending advisory records without a root CTA', async () => {
    const tmp = await Fs.makeTempDir({ prefix: 'sys.tools.upgrade.advisory.pending.' });
    const path = `${tmp.absolute}/advisory.json`;

    try {
      await writeUpgradeAdvisorySuccess(
        {
          local: '0.0.318',
          remote: '9.9.9',
          latest: '0.0.318',
          actionable: '0.0.318',
          is: { latest: true, upgradeAvailable: false, pending: true },
        },
        { path, now: fixture.now(12_346) },
      );
      const res = await readUpgradeAdvisoryState({ path });

      expect(res.record).to.eql({
        schemaVersion: 2,
        package: '@sys/tools',
        checkedAt: 12_346,
        ok: true,
        local: '0.0.318',
        published: '9.9.9',
        actionable: '0.0.318',
        status: 'pending',
      });
      expect(res.hasUpgrade).to.eql(false);
      expect(res.prelude).to.eql(undefined);
    } finally {
      await Fs.remove(tmp.absolute);
    }
  });

  it('surfaces pending minimum-age resolver policy without a root CTA', async () => {
    const tmp = await Fs.makeTempDir({ prefix: 'sys.tools.upgrade.advisory.pending.reason.' });
    const path = `${tmp.absolute}/advisory.json`;

    try {
      await writeUpgradeAdvisorySuccess(
        {
          local: '0.0.318',
          remote: '9.9.9',
          latest: '0.0.318',
          actionable: '0.0.318',
          latestResolution: {
            ok: false,
            specifier: 'jsr:@sys/tools@9.9.9' as t.StringModuleSpecifier,
            registry: 'jsr',
            package: '@sys/tools' as t.StringPkgName,
            reason: {
              code: 'policy:minimum-dependency-age',
              message: 'minimum dependency date',
              minimumDependencyDate: '2026-07-04T04:32:25.677189Z' as t.StringTimestamp,
            },
          },
          is: { latest: true, upgradeAvailable: false, pending: true },
        },
        { path, now: fixture.now(12_347) },
      );
      const res = await readUpgradeAdvisoryState({ path });
      const prelude = Cli.stripAnsi(res.prelude ?? '');

      expect(res.record).to.eql({
        schemaVersion: 2,
        package: '@sys/tools',
        checkedAt: 12_347,
        ok: true,
        local: '0.0.318',
        published: '9.9.9',
        actionable: '0.0.318',
        status: 'pending',
        reason: {
          code: 'policy:minimum-dependency-age',
          message: 'minimum dependency date',
          minimumDependencyDate: '2026-07-04T04:32:25.677189Z',
        },
      });
      expect(res.hasUpgrade).to.eql(false);
      expect(prelude).to.contain('@sys/tools 9.9.9 published; upgrade pending — standing down');
      expect(prelude).to.contain('Waiting for the minimum dependency age window to pass');
      expect(prelude).to.not.contain('sys upgrade --latest');
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
        schemaVersion: 2,
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
    let written: t.UpgradeTool.VersionInfo | undefined;
    const res = await runUpgradeAdvisoryProbe({
      getVersionInfo: async () => ({
        local: '0.0.1',
        remote: '0.0.2',
        latest: '0.0.2',
        actionable: '0.0.2',
        is: { latest: false, upgradeAvailable: true, pending: false },
      }),
      writeSuccess: async (version) => {
        written = version;
      },
      writeFailure: async () => {
        throw new Error('should not write failure');
      },
    });

    expect(res).to.eql({ ok: true, remote: '0.0.2' });
    expect(written?.remote).to.eql('0.0.2');
    expect(written?.actionable).to.eql('0.0.2');
  });

  it('probe writes pending advisory state without a root CTA', async () => {
    const tmp = await Fs.makeTempDir({ prefix: 'sys.tools.upgrade.advisory.probe.pending.' });
    const path = `${tmp.absolute}/advisory.json`;

    try {
      const res = await runUpgradeAdvisoryProbe({
        getVersionInfo: async () => ({
          local: '0.0.318',
          remote: '9.9.9',
          latest: '0.0.318',
          actionable: '0.0.318',
          is: { latest: true, upgradeAvailable: false, pending: true },
        }),
        writeSuccess: async (version) => {
          await writeUpgradeAdvisorySuccess(version, { path, now: fixture.now(22) });
        },
        writeFailure: async () => {
          throw new Error('should not write failure');
        },
      });
      const state = await readUpgradeAdvisoryState({ path });

      expect(res).to.eql({ ok: true, remote: '9.9.9' });
      expect(state.record?.ok && state.record.status).to.eql('pending');
      expect(state.hasUpgrade).to.eql(false);
      expect(state.prelude).to.eql(undefined);
    } finally {
      await Fs.remove(tmp.absolute);
    }
  });

  it('probe keeps live success when advisory persistence fails', async () => {
    const res = await runUpgradeAdvisoryProbe({
      getVersionInfo: async () => ({
        local: '0.0.1',
        remote: '0.0.2',
        latest: '0.0.2',
        actionable: '0.0.2',
        is: { latest: false, upgradeAvailable: true, pending: false },
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
