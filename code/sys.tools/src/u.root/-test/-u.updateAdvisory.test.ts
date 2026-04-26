import { describe, expect, it } from '../../-test.ts';
import { prepareRootUpdateAdvisory, refreshRootUpdateAdvisoryInBackground } from '../u.updateAdvisory.ts';

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
