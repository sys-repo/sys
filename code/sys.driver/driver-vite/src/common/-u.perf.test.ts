import { type t, describe, expect, it, stripAnsi } from '../-test/common.ts';

import { Perf } from './u.perf.ts';

const ENV_ENABLED = 'SYS_DRIVER_VITE_PERF';
const ENV_EPOCH = 'SYS_DRIVER_VITE_PERF_EPOCH';

describe('Perf', () => {
  it('parses leveled perf env values and preserves them for child processes', () => {
    wrangle.reset({ enabled: '2', epoch: '123' });

    expect(Perf.level()).to.eql(2);
    expect(Perf.enabled()).to.eql(true);
    expect(Perf.enabled(2)).to.eql(true);
    expect(Perf.enabled(3)).to.eql(false);
    expect(Perf.epoch()).to.eql(123);
    expect(Perf.childEnv()).to.eql({
      SYS_DRIVER_VITE_PERF: '2',
      SYS_DRIVER_VITE_PERF_EPOCH: '123',
    });
  });

  it('gates logs by level and keeps pid out of level 1 prefix', async () => {
    wrangle.reset({ enabled: '1', epoch: '1' });

    const lines = await wrangle.capture(async () => {
      Perf.log('dev.parent.ready');
      Perf.log('transport.resolveDeno.inflight', {}, { level: 3 });
    });

    expect(lines.length).to.eql(1);
    expect(lines[0]).to.include('[driver-vite:perf +');
    expect(lines[0]).to.include('dev.parent.ready');
    expect(lines[0]).to.not.include(' p=');
  });

  it('supports thresholded samples, deduped trace logs, and pid in deeper levels', async () => {
    wrangle.reset({ enabled: '3', epoch: '1' });

    const lines = await wrangle.capture(async () => {
      Perf.sample('transport.resolveDeno', 5 as t.Msecs, {}, { level: 2, thresholdMs: 20 as t.Msecs });
      Perf.sample('transport.resolveDeno', 25 as t.Msecs, {}, { level: 2, thresholdMs: 20 as t.Msecs });
      Perf.log('transport.resolveDeno.inflight', { id: 'jsr:@sys/std/is' }, {
        level: 3,
        dedupeKey: 'inflight:jsr:@sys/std/is',
      });
      Perf.log('transport.resolveDeno.inflight', { id: 'jsr:@sys/std/is' }, {
        level: 3,
        dedupeKey: 'inflight:jsr:@sys/std/is',
      });
    });

    expect(lines.length).to.eql(2);
    expect(lines[0]).to.include('transport.resolveDeno');
    expect(lines[0]).to.include('elapsed=25');
    expect(lines[0]).to.include('count=1');
    expect(lines[0]).to.include('total=25');
    expect(lines[0]).to.include(' p=');
    expect(lines[1]).to.include('transport.resolveDeno.inflight');
    expect(lines[1]).to.include('id=\"jsr:@sys/std/is\"');
  });
});

const wrangle = {
  reset(args: { enabled?: string; epoch?: string } = {}) {
    if (args.enabled === undefined) Deno.env.delete(ENV_ENABLED);
    else Deno.env.set(ENV_ENABLED, args.enabled);

    if (args.epoch === undefined) Deno.env.delete(ENV_EPOCH);
    else Deno.env.set(ENV_EPOCH, args.epoch);

    Reflect.deleteProperty(globalThis as typeof globalThis & { __sysDriverVitePerfState__?: unknown }, '__sysDriverVitePerfState__');
  },

  async capture(run: () => void | Promise<void>) {
    const lines: string[] = [];
    const original = console.info;
    console.info = (...args: unknown[]) => {
      lines.push(stripAnsi(args.map((value) => String(value)).join(' ')));
    };

    try {
      await run();
    } finally {
      console.info = original;
      wrangle.reset();
    }

    return lines;
  },
} as const;
