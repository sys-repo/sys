import { describe, expect, it, type t } from '../../-test.ts';
import {
  prepareRootUpdateAdvisory,
  refreshRootUpdateAdvisoryInBackground,
  runRootUpdateAdvisory,
  runWithRootUpdateAdvisory,
} from '../u.updateAdvisory.ts';

describe('Root update advisory', () => {
  it('prepares root advisory state by delegating to the update-owned advisory seam', async () => {
    const res = await prepareRootUpdateAdvisory({
      readState: async () => ({
        path: '/tmp/advisory.json',
        record: undefined,
        stale: false,
        hasUpdate: true,
        prelude: 'Run sys update --latest',
      }),
    });

    expect(res).to.eql({
      path: '/tmp/advisory.json',
      record: undefined,
      stale: false,
      hasUpdate: true,
      prelude: 'Run sys update --latest',
    });
  });

  it('does not read, probe, display, or refresh when the root flag disables update checks', async () => {
    const events: string[] = [];

    const res = await runRootUpdateAdvisory({
      noUpdateCheck: true,
      readState: async () => {
        events.push('read');
        throw new Error('should not read advisory state');
      },
      probe: async () => {
        events.push('probe');
        return { ok: true, remote: '9.9.9' as t.StringSemver };
      },
      spawnQuiet() {
        events.push('refresh');
      },
      info(...data) {
        events.push(`info:${data.map(String).join(' ')}`);
      },
    });

    expect(events).to.eql([]);
    expect(res).to.eql({
      path: undefined,
      record: undefined,
      stale: false,
      hasUpdate: false,
      prelude: undefined,
    });
  });

  it('does not read or probe when SYS_TOOLS_NO_UPDATE_CHECK=1 disables update checks', async () => {
    const events: string[] = [];

    const res = await prepareRootUpdateAdvisory({
      env: (name) => name === 'SYS_TOOLS_NO_UPDATE_CHECK' ? '1' : undefined,
      readState: async () => {
        events.push('read');
        throw new Error('should not read advisory state');
      },
      probe: async () => {
        events.push('probe');
        return { ok: true, remote: '9.9.9' as t.StringSemver };
      },
    });

    expect(events).to.eql([]);
    expect(res.hasUpdate).to.eql(false);
    expect(res.stale).to.eql(false);
  });

  it('refreshes stale advisory state before returning to startup', async () => {
    const events: string[] = [];
    let refreshed = false;

    const res = await prepareRootUpdateAdvisory({
      readState: async () => {
        events.push('read');
        return refreshed
          ? {
            path: '/tmp/advisory.json' as never,
            record: undefined,
            stale: false,
            hasUpdate: true,
            prelude: 'Run sys update --latest',
          }
          : {
            path: '/tmp/advisory.json' as never,
            record: undefined,
            stale: true,
            hasUpdate: false,
            prelude: undefined,
          };
      },
      probe: async () => {
        events.push('probe');
        refreshed = true;
        return { ok: true, remote: '9.9.9' as t.StringSemver };
      },
    });

    expect(events).to.eql(['read', 'probe', 'read']);
    expect(res.hasUpdate).to.eql(true);
    expect(res.prelude).to.eql('Run sys update --latest');
  });

  it('runs the advisory check before a direct tool entrypoint', async () => {
    const events: string[] = [];
    let refreshed = false;

    await runWithRootUpdateAdvisory(
      async () => {
        events.push('tool');
      },
      {
        readState: async () => {
          events.push('read');
          return refreshed
            ? {
              path: '/tmp/advisory.json' as never,
              record: undefined,
              stale: false,
              hasUpdate: true,
              prelude: 'Run sys update --latest',
            }
            : {
              path: '/tmp/advisory.json' as never,
              record: undefined,
              stale: true,
              hasUpdate: false,
              prelude: undefined,
            };
        },
        probe: async () => {
          events.push('probe');
          refreshed = true;
          return { ok: true, remote: '9.9.9' as t.StringSemver };
        },
        spawnQuiet() {
          events.push('refresh');
        },
        info(...data) {
          events.push(`info:${data.map(String).join(' ')}`);
        },
      },
    );

    expect(events).to.eql([
      'read',
      'probe',
      'read',
      'info:Run sys update --latest',
      'tool',
    ]);
  });

  it('returns the advisory state for root menu highlighting', async () => {
    const res = await runRootUpdateAdvisory({
      readState: async () => ({
        path: undefined,
        record: undefined,
        stale: false,
        hasUpdate: true,
        prelude: undefined,
      }),
      spawnQuiet() {
        throw new Error('fresh state should not refresh');
      },
    });

    expect(res.hasUpdate).to.eql(true);
  });

  it('continues to the direct tool when advisory state cannot be read', async () => {
    const events: string[] = [];

    await runWithRootUpdateAdvisory(
      async () => {
        events.push('tool');
      },
      {
        readState: async () => {
          events.push('read');
          throw new Error('cache unavailable');
        },
        spawnQuiet() {
          events.push('refresh');
        },
      },
    );

    expect(events).to.eql(['read', 'tool']);
  });

  it('spawns the quiet advisory probe only when the cached advisory is stale and path-backed', () => {
    const calls: string[] = [];

    refreshRootUpdateAdvisoryInBackground(
      {
        path: '/tmp/advisory.json',
        record: undefined,
        stale: true,
        hasUpdate: false,
        prelude: undefined,
      },
      {
        spawnQuiet(specifier) {
          calls.push(specifier);
        },
      },
    );

    expect(calls.length).to.eql(1);
    expect(calls[0]?.endsWith('/cli.update/u.advisory.probe.entry.ts')).to.eql(true);
  });

  it('does not spawn the quiet advisory probe when the advisory is fresh', () => {
    const calls: string[] = [];

    refreshRootUpdateAdvisoryInBackground(
      {
        path: '/tmp/advisory.json',
        record: undefined,
        stale: false,
        hasUpdate: false,
        prelude: undefined,
      },
      {
        spawnQuiet(specifier) {
          calls.push(specifier);
        },
      },
    );

    expect(calls).to.eql([]);
  });

  it('does not spawn the quiet advisory probe when update checks are disabled', () => {
    const calls: string[] = [];

    refreshRootUpdateAdvisoryInBackground(
      {
        path: '/tmp/advisory.json',
        record: undefined,
        stale: true,
        hasUpdate: false,
        prelude: undefined,
      },
      {
        noUpdateCheck: true,
        spawnQuiet(specifier) {
          calls.push(specifier);
        },
      },
    );

    expect(calls).to.eql([]);
  });

  it('ignores quiet advisory probe spawn failures', () => {
    refreshRootUpdateAdvisoryInBackground(
      {
        path: '/tmp/advisory.json',
        record: undefined,
        stale: true,
        hasUpdate: false,
        prelude: undefined,
      },
      {
        spawnQuiet() {
          throw new Error('spawn unavailable');
        },
      },
    );
  });

  it('does not spawn the quiet advisory probe when persistence is unavailable', () => {
    const calls: string[] = [];

    refreshRootUpdateAdvisoryInBackground(
      {
        path: undefined,
        record: undefined,
        stale: true,
        hasUpdate: false,
        prelude: undefined,
      },
      {
        spawnQuiet(specifier) {
          calls.push(specifier);
        },
      },
    );

    expect(calls).to.eql([]);
  });
});
