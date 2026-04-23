import { Is, Json, Time } from './libs.ts';
import type * as t from './t.ts';

const ENV = {
  ENABLED: 'SYS_DRIVER_VITE_PERF',
  EPOCH: 'SYS_DRIVER_VITE_PERF_EPOCH',
} as const;

type PerfState = {
  enabled: boolean;
  epoch: t.Msecs;
  samples: Map<string, { count: number; total: t.Msecs }>;
};

type PerfMeta = Record<string, unknown>;

type PerfGlobal = typeof globalThis & {
  __sysDriverVitePerfState__?: PerfState;
};

export const Perf = {
  enabled() {
    return perf.state().enabled;
  },

  epoch() {
    return perf.state().epoch;
  },

  childEnv(): Record<string, string> {
    if (!Perf.enabled()) return {};
    return {
      [ENV.ENABLED]: '1',
      [ENV.EPOCH]: String(Perf.epoch()),
    };
  },

  sinceStart() {
    return Time.elapsed(Perf.epoch()).msec;
  },

  log(label: string, meta: PerfMeta = {}) {
    if (!Perf.enabled()) return;
    const sinceStart = Perf.sinceStart();
    const suffix = perf.meta(meta);
    console.info(`[driver-vite:perf +${sinceStart}ms pid=${Deno.pid}] ${label}${suffix}`);
  },

  sample(label: string, elapsed: t.Msecs, meta: PerfMeta = {}) {
    if (!Perf.enabled()) return;
    const summary = perf.record(label, elapsed);
    Perf.log(label, {
      elapsed,
      count: summary.count,
      total: summary.total,
      ...meta,
    });
  },

  section(label: string, meta: PerfMeta = {}) {
    const startedAt = Time.now.timestamp as t.Msecs;
    return (extra: PerfMeta = {}) => {
      const elapsed = Time.elapsed(startedAt).msec;
      Perf.sample(label, elapsed, { ...meta, ...extra });
      return elapsed;
    };
  },

  async measure<T>(label: string, run: () => Promise<T>, meta: PerfMeta = {}): Promise<T> {
    const end = Perf.section(label, meta);
    try {
      const result = await run();
      end({ ok: true });
      return result;
    } catch (error) {
      end({ ok: false, error: perf.error(error) });
      throw error;
    }
  },
} as const;

const perf = {
  state() {
    const root = globalThis as PerfGlobal;
    const existing = root.__sysDriverVitePerfState__;
    if (existing) return existing;

    const enabled = perf.enabledFromEnv(Deno.env.get(ENV.ENABLED));
    const epoch = perf.epochFromEnv(Deno.env.get(ENV.EPOCH)) ?? (Time.now.timestamp as t.Msecs);
    const state: PerfState = { enabled, epoch, samples: new Map() };
    root.__sysDriverVitePerfState__ = state;
    return state;
  },

  enabledFromEnv(value?: string | null) {
    if (!Is.string(value)) return false;
    const normalized = value.trim().toLowerCase();
    return normalized !== '' && normalized !== '0' && normalized !== 'false' && normalized !== 'off' && normalized !== 'no';
  },

  epochFromEnv(value?: string | null) {
    if (!Is.string(value)) return undefined;
    const parsed = Number(value);
    if (!Is.num(parsed) || !Number.isFinite(parsed) || parsed <= 0) return undefined;
    return parsed as t.Msecs;
  },

  record(label: string, elapsed: t.Msecs) {
    const state = perf.state();
    const prev = state.samples.get(label) ?? { count: 0, total: 0 as t.Msecs };
    const next = {
      count: prev.count + 1,
      total: (prev.total + elapsed) as t.Msecs,
    };
    state.samples.set(label, next);
    return next;
  },

  error(input: unknown) {
    if (input instanceof Error) return input.message;
    return String(input);
  },

  meta(input: PerfMeta) {
    const entries = Object.entries(input)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => `${key}=${perf.value(value)}`);
    return entries.length > 0 ? ` ${entries.join(' ')}` : '';
  },

  value(input: unknown) {
    if (typeof input === 'string') return perf.quote(input);
    if (typeof input === 'number' || typeof input === 'boolean') return String(input);
    if (input === null) return 'null';

    try {
      return perf.quote(Json.stringify(input));
    } catch {
      return perf.quote(String(input));
    }
  },

  quote(input: string) {
    const text = input.length > 140 ? `${input.slice(0, 137)}...` : input;
    return JSON.stringify(text);
  },
} as const;
