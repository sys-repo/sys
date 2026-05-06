import { Cli, describe, expect, it, type t } from '../../-test.ts';
import { prepareRootUpdateAdvisory, runWithRootUpdateAdvisory } from '../u.updateAdvisory.ts';

describe('Root update advisory', () => {
  it('returns cached advisory state and starts the update-owned advisory seam', async () => {
    const events: string[] = [];
    let resolveProbe: (() => void) | undefined;
    const probeDone = new Promise<void>((resolve) => (resolveProbe = resolve));

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
        await probeDone;
        return { ok: true, remote: '9.9.9' as t.StringSemver };
      },
    });

    expect(events).to.eql(['read', 'probe']);
    expect(res.path).to.eql('/tmp/advisory.json');
    expect(res.record).to.eql(undefined);
    expect(res.hasUpdate).to.eql(true);
    expect(Cli.stripAnsi(res.prelude ?? '')).to.contain('sys update --latest');
    resolveProbe?.();
    await Promise.resolve();
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

  it('starts a background probe for path-backed advisory state without using it for startup', async () => {
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
    expect(res.hasUpdate).to.eql(false);
    expect(res.prelude).to.eql(undefined);
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
    expect(res.hasUpdate).to.eql(false);
    expect(res.prelude).to.eql(undefined);
  });

  it('starts a background probe even when advisory persistence is unavailable', async () => {
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
    expect(res.hasUpdate).to.eql(false);
    expect(res.prelude).to.eql(undefined);
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

  it('starts the advisory probe before a direct tool entrypoint without waiting for it', async () => {
    const events: string[] = [];
    let resolveProbe: (() => void) | undefined;
    const probeDone = new Promise<void>((resolve) => (resolveProbe = resolve));

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
          await probeDone;
          return { ok: true, remote: '9.9.9' as t.StringSemver };
        },
        info(...data) {
          events.push(`info:${Cli.stripAnsi(String(data[0])).includes('sys update --latest')}`);
        },
      },
    );

    expect(events).to.eql(['read', 'probe', 'tool']);
    resolveProbe?.();
    await Promise.resolve();
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
