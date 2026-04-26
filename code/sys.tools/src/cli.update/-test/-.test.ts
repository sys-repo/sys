import { Cli, describe, expect, Fs, it, type t } from '../../-test.ts';
import { D } from '../common.ts';
import { UpdateTools } from '../mod.ts';
import {
  readUpdateAdvisoryState,
  shouldRefreshUpdateAdvisory,
  toRootUpdateAdvisoryPrelude,
  writeUpdateAdvisoryFailure,
  writeUpdateAdvisorySuccess,
} from '../u.advisory.ts';
import { resolveUpdateAdvisoryPath } from '../u.advisory.path.ts';
import { runUpdateAdvisoryProbe } from '../u.advisory.probe.ts';
import { runUpdate } from '../u.cmd.runUpdate.ts';

describe(D.tool.name, () => {
  it('API', async () => {
    const m = await import('@sys/tools/update');
    expect(m.UpdateTools).to.equal(UpdateTools);
  });
});

describe('cli.update advisory', () => {
  it('resolves advisory path from XDG cache home', () => {
    const path = resolveUpdateAdvisoryPath(fixture.env({ XDG_CACHE_HOME: '/tmp/xdg', HOME: '/tmp/home' }));
    expect(path).to.eql('/tmp/xdg/@sys.tools/advisory.json');
  });

  it('falls back to HOME cache when XDG cache home is unavailable', () => {
    const path = resolveUpdateAdvisoryPath(fixture.env({ HOME: '/tmp/home' }));
    expect(path).to.eql('/tmp/home/.cache/@sys.tools/advisory.json');
  });

  it('disables advisory path resolution when no cache root is available', () => {
    const path = resolveUpdateAdvisoryPath(fixture.env({}));
    expect(path).to.eql(undefined);
  });

  it('treats missing records as stale so the first probe can run', () => {
    expect(shouldRefreshUpdateAdvisory(undefined, { now: fixture.now(2_000) })).to.eql(true);
  });

  it('treats fresh records as non-stale within the ttl window', () => {
    expect(
      shouldRefreshUpdateAdvisory(
        { package: '@sys/tools', checkedAt: 1_000, ok: true, remote: '0.0.372' },
        { now: fixture.now(1_000 + 60_000) },
      ),
    ).to.eql(false);
  });

  it('treats old records as stale once the ttl expires', () => {
    expect(
      shouldRefreshUpdateAdvisory(
        { package: '@sys/tools', checkedAt: 1_000, ok: true, remote: '0.0.372' },
        { now: fixture.now(1_000 + 25 * 60 * 60 * 1000) },
      ),
    ).to.eql(true);
  });

  it('suppresses the pre-menu advisory when cached remote is not newer', () => {
    const text = toRootUpdateAdvisoryPrelude({
      package: '@sys/tools',
      checkedAt: 1,
      ok: true,
      remote: '0.0.1',
    });

    expect(text).to.eql(undefined);
  });

  it('reads malformed advisory files fail-quiet and marks them stale', async () => {
    const tmp = await Fs.makeTempDir({ prefix: 'sys.tools.update.advisory.malformed.' });
    const path = `${tmp.absolute}/advisory.json`;

    try {
      await Fs.write(path, '{nope');
      const res = await readUpdateAdvisoryState({ path, now: fixture.now(5_000) });
      expect(res.record).to.eql(undefined);
      expect(res.hasUpdate).to.eql(false);
      expect(res.prelude).to.eql(undefined);
      expect(res.stale).to.eql(true);
    } finally {
      await Fs.remove(tmp.absolute);
    }
  });

  it('debug remote env forces a pre-menu advisory block without persistence', async () => {
    const key = 'SYS_TOOLS_DEBUG_UPDATE_ADVISORY_REMOTE';
    const before = Deno.env.get(key);

    try {
      Deno.env.set(key, '9.9.9');
      const res = await readUpdateAdvisoryState({ now: fixture.now(1_000) });
      expect(res.path).to.eql(undefined);
      expect(res.stale).to.eql(false);
      expect(res.hasUpdate).to.eql(true);
      expect(res.record?.ok).to.eql(true);
      if (res.record?.ok) expect(res.record.remote).to.eql('9.9.9');
      expect(Cli.stripAnsi(res.prelude ?? '')).to.contain('Run sys update --latest');
      expect(Cli.stripAnsi(res.prelude ?? '')).to.not.contain('Package');
    } finally {
      before === undefined ? Deno.env.delete(key) : Deno.env.set(key, before);
    }
  });

  it('derives a narrow pre-menu advisory block only when cached remote is newer', () => {
    const text = Cli.stripAnsi(
      toRootUpdateAdvisoryPrelude({
        package: '@sys/tools',
        checkedAt: 1,
        ok: true,
        remote: '9.9.9',
      }) ?? '',
    );

    expect(text).to.not.contain('Package');
    expect(text).to.not.contain('@sys/tools');
    expect(text).to.contain('Run sys update --latest');
  });

  it('writes and reads success advisory records', async () => {
    const tmp = await Fs.makeTempDir({ prefix: 'sys.tools.update.advisory.success.' });
    const path = `${tmp.absolute}/advisory.json`;

    try {
      await writeUpdateAdvisorySuccess('9.9.9', { path, now: fixture.now(12_345) });
      const res = await readUpdateAdvisoryState({ path, now: fixture.now(12_346) });

      expect(res.record).to.eql({
        package: '@sys/tools',
        checkedAt: 12_345,
        ok: true,
        remote: '9.9.9',
      });
      expect(res.hasUpdate).to.eql(true);
      expect(Cli.stripAnsi(res.prelude ?? '')).to.contain('Run sys update --latest');
      expect(res.stale).to.eql(false);
    } finally {
      await Fs.remove(tmp.absolute);
    }
  });

  it('writes failure advisory records quietly', async () => {
    const tmp = await Fs.makeTempDir({ prefix: 'sys.tools.update.advisory.failure.' });
    const path = `${tmp.absolute}/advisory.json`;

    try {
      await writeUpdateAdvisoryFailure(new Error('network down'), { path, now: fixture.now(55) });
      const res = await readUpdateAdvisoryState({ path, now: fixture.now(56) });

      expect(res.record).to.eql({
        package: '@sys/tools',
        checkedAt: 55,
        ok: false,
        error: 'network down',
      });
      expect(res.hasUpdate).to.eql(false);
      expect(res.prelude).to.eql(undefined);
    } finally {
      await Fs.remove(tmp.absolute);
    }
  });

  it('probe writes success advisory state from fetched version info', async () => {
    let written: string | undefined;
    const res = await runUpdateAdvisoryProbe({
      getVersionInfo: async () => ({ local: '0.0.1', remote: '0.0.2', latest: '0.0.2', is: { latest: false } }),
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

  it('probe writes failure advisory state when live version fetch fails', async () => {
    let wroteFailure = false;
    const res = await runUpdateAdvisoryProbe({
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

describe('cli.update.runUpdate', () => {
  it('shows a version-check spinner and exits without prompting when already latest', async () => {
    const events: string[] = [];
    let prompted = false;
    let refreshed = false;
    let advisoryRemote = '';

    await runUpdate('/tmp' as t.StringDir, { interactive: true }, {
      getVersionInfo: async () => ({
        local: '0.0.318',
        remote: '0.0.318',
        latest: '0.0.318',
        is: { latest: true },
      }),
      refreshCache: async () => {
        refreshed = true;
        return {
          success: true,
          code: 0,
          text: { stdout: '', stderr: '' },
          toString: () => '',
        };
      },
      prompt: async () => {
        prompted = true;
        return 'upgrade';
      },
      spinner: () => spinner(events),
      info: (...data) => {
        events.push(`info:${data.map(String).join(' ')}`);
      },
      writeAdvisorySuccess: async (remote) => {
        advisoryRemote = remote;
      },
    });

    const plain = events.map((line) => Cli.stripAnsi(line));
    expect(plain[0]).to.include('start:checking latest @sys/tools version...');
    expect(plain[1]).to.eql('stop');
    expect(
      plain.some((line) =>
        line.includes('Local version 0.0.318 of @sys/tools is the most recent release')
      ),
    ).to.eql(true);
    expect(prompted).to.eql(false);
    expect(refreshed).to.eql(false);
    expect(advisoryRemote).to.eql('0.0.318');
  });

  it('checks latest first, then prompts, then runs the refresh spinner', async () => {
    const events: string[] = [];
    let advisoryRemote = '';

    await runUpdate('/tmp' as t.StringDir, { interactive: true }, {
      getVersionInfo: async () => ({
        local: '0.0.318',
        remote: '0.0.319',
        latest: '0.0.319',
        is: { latest: false },
      }),
      refreshCache: async () => ({
        success: true,
        code: 0,
        text: { stdout: '', stderr: '' },
        toString: () => '',
      }),
      prompt: async () => {
        events.push('prompt');
        return 'upgrade';
      },
      spinner: () => spinner(events),
      info(...data) {
        events.push(`info:${data.map(String).join(' ')}`);
      },
      async writeAdvisorySuccess(remote) {
        advisoryRemote = remote;
      },
    });

    const plain = events.map((line) => Cli.stripAnsi(line));
    expect(plain[0]).to.include('start:checking latest @sys/tools version...');
    expect(plain[1]).to.eql('stop');
    expect(plain).to.include('prompt');
    expect(plain.findIndex((line) => line.includes('start:checking latest @sys/tools version...')))
      .to.be.lessThan(
        plain.indexOf('prompt'),
      );
    expect(
      plain.findIndex((line) =>
        line.includes('start:upgrading @sys/tools from 0.0.318 to 0.0.319...')
      ),
    ).to.be.greaterThan(
      plain.indexOf('prompt'),
    );
    expect(advisoryRemote).to.eql('0.0.319');
  });

  it('keeps update flow working when advisory persistence fails', async () => {
    const events: string[] = [];
    let refreshed = false;

    await runUpdate('/tmp' as t.StringDir, { interactive: false }, {
      getVersionInfo: async () => ({
        local: '0.0.318',
        remote: '0.0.319',
        latest: '0.0.319',
        is: { latest: false },
      }),
      refreshCache: async () => {
        refreshed = true;
        return {
          success: true,
          code: 0,
          text: { stdout: '', stderr: '' },
          toString: () => '',
        };
      },
      prompt: async () => 'upgrade',
      spinner: () => spinner(events),
      info(...data) {
        events.push(`info:${data.map(String).join(' ')}`);
      },
      async writeAdvisorySuccess() {
        throw new Error('disk full');
      },
    });

    const plain = events.map((line) => Cli.stripAnsi(line));
    expect(refreshed).to.eql(true);
    expect(
      plain.some((line) =>
        line.includes('Updated @sys/tools to latest 0.0.319 ✔')
      ),
    ).to.eql(true);
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

function spinner(events: string[]) {
  return {
    text: '',
    start(text?: string) {
      events.push(`start:${Cli.stripAnsi(String(text ?? ''))}`);
      this.text = String(text ?? '');
      return this;
    },
    stop() {
      events.push('stop');
      return this;
    },
    succeed(text?: string) {
      events.push(`succeed:${Cli.stripAnsi(String(text ?? ''))}`);
      this.text = String(text ?? '');
      return this;
    },
    fail(text?: string) {
      events.push(`fail:${Cli.stripAnsi(String(text ?? ''))}`);
      this.text = String(text ?? '');
      return this;
    },
  };
}
