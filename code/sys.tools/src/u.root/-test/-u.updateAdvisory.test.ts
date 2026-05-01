import { describe, expect, it } from '../../-test.ts';
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
        stale: true,
        hasUpdate: true,
        prelude: 'Run sys update --latest',
      }),
    });

    expect(res).to.eql({
      path: '/tmp/advisory.json',
      record: undefined,
      stale: true,
      hasUpdate: true,
      prelude: 'Run sys update --latest',
    });
  });

  it('runs the advisory check before a direct tool entrypoint', async () => {
    const events: string[] = [];

    await runWithRootUpdateAdvisory(
      async () => {
        events.push('tool');
      },
      {
        readState: async () => {
          events.push('read');
          return {
            path: '/tmp/advisory.json' as never,
            record: undefined,
            stale: true,
            hasUpdate: true,
            prelude: 'Run sys update --latest',
          };
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
      'refresh',
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
