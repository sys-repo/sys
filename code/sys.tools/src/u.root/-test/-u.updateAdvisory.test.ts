import { describe, expect, it, type t } from '../../-test.ts';
import { prepareRootUpdateAdvisory, runWithRootUpdateAdvisory } from '../u.updateAdvisory.ts';

describe('Root update advisory', () => {
  it('prepares root advisory state through the update-owned advisory seam', async () => {
    const events: string[] = [];

    const res = await prepareRootUpdateAdvisory({
      readState: async () => {
        events.push('read');
        return {
          path: '/tmp/advisory.json',
          record: undefined,
          hasUpdate: true,
          prelude: 'Run sys update --latest',
        };
      },
      probe: async () => {
        events.push('probe');
        return { ok: true, remote: '9.9.9' as t.StringSemver };
      },
    });

    expect(events).to.eql(['read', 'probe']);
    expect(res.path).to.eql('/tmp/advisory.json');
    expect(res.record?.ok).to.eql(true);
    if (res.record?.ok) expect(res.record.remote).to.eql('9.9.9');
    expect(res.hasUpdate).to.eql(true);
    expect(res.prelude ?? '').to.contain('sys update --latest');
  });

  it('does not read or probe when the root flag disables update checks', async () => {
    const events: string[] = [];

    const res = await prepareRootUpdateAdvisory({
      noUpdateCheck: true,
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
    expect(res).to.eql({
      path: undefined,
      record: undefined,
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
  });

  it('does not read or probe when argv contains --no-update-check', async () => {
    const events: string[] = [];

    const res = await prepareRootUpdateAdvisory({
      argv: ['--no-update-check'],
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
  });

  it('probes path-backed advisory state before returning to startup', async () => {
    const events: string[] = [];

    const res = await prepareRootUpdateAdvisory({
      readState: async () => {
        events.push('read');
        return {
          path: '/tmp/advisory.json' as never,
          record: undefined,
          hasUpdate: false,
          prelude: undefined,
        };
      },
      probe: async () => {
        events.push('probe');
        return { ok: true, remote: '9.9.9' as t.StringSemver };
      },
    });

    expect(events).to.eql(['read', 'probe']);
    expect(res.hasUpdate).to.eql(true);
    expect(res.prelude ?? '').to.contain('sys update --latest');
  });

  it('probes even when cached advisory state has no update', async () => {
    const events: string[] = [];

    const res = await prepareRootUpdateAdvisory({
      readState: async () => {
        events.push('read');
        return {
          path: '/tmp/advisory.json' as never,
          record: undefined,
          hasUpdate: false,
          prelude: undefined,
        };
      },
      probe: async () => {
        events.push('probe');
        return { ok: true, remote: '9.9.9' as t.StringSemver };
      },
    });

    expect(events).to.eql(['read', 'probe']);
    expect(res.hasUpdate).to.eql(true);
    expect(res.prelude ?? '').to.contain('sys update --latest');
  });

  it('uses the live probe result even when advisory persistence is unavailable', async () => {
    const events: string[] = [];

    const res = await prepareRootUpdateAdvisory({
      readState: async () => {
        events.push('read');
        return {
          path: undefined,
          record: undefined,
          hasUpdate: false,
          prelude: undefined,
        };
      },
      probe: async () => {
        events.push('probe');
        return { ok: true, remote: '9.9.9' as t.StringSemver };
      },
    });

    expect(events).to.eql(['read', 'probe']);
    expect(res.path).to.eql(undefined);
    expect(res.hasUpdate).to.eql(true);
    expect(res.prelude ?? '').to.contain('sys update --latest');
  });

  it('keeps non-persistent forced advisory state without probing', async () => {
    const events: string[] = [];

    const res = await prepareRootUpdateAdvisory({
      readState: async () => {
        events.push('read');
        return {
          path: undefined,
          record: undefined,
          hasUpdate: true,
          prelude: 'Run sys update --latest',
        };
      },
      probe: async () => {
        events.push('probe');
        return { ok: false };
      },
    });

    expect(events).to.eql(['read']);
    expect(res.hasUpdate).to.eql(true);
    expect(res.prelude).to.eql('Run sys update --latest');
  });

  it('returns the cached advisory state for root menu highlighting when the live probe fails', async () => {
    const res = await prepareRootUpdateAdvisory({
      readState: async () => ({
        path: '/tmp/advisory.json',
        record: undefined,
        hasUpdate: true,
        prelude: undefined,
      }),
      probe: async () => ({ ok: false }),
    });

    expect(res.hasUpdate).to.eql(true);
  });

  it('continues when advisory state cannot be read', async () => {
    const events: string[] = [];

    const res = await prepareRootUpdateAdvisory({
      readState: async () => {
        events.push('read');
        throw new Error('cache unavailable');
      },
      probe: async () => {
        events.push('probe');
        return { ok: false };
      },
    });

    expect(events).to.eql(['read', 'probe']);
    expect(res.hasUpdate).to.eql(false);
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
            hasUpdate: false,
            prelude: undefined,
          };
        },
        probe: async () => {
          events.push('probe');
          return { ok: true, remote: '9.9.9' as t.StringSemver };
        },
        info(...data) {
          events.push(`info:${String(data[0]).includes('sys update --latest')}`);
        },
      },
    );

    expect(events).to.eql([
      'read',
      'probe',
      'info:true',
      'tool',
    ]);
  });

  it('direct tool entrypoints continue when advisory preparation fails', async () => {
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
        probe: async () => {
          events.push('probe');
          return { ok: false };
        },
      },
    );

    expect(events).to.eql(['read', 'probe', 'tool']);
  });
});
