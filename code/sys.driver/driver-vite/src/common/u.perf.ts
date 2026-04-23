import { Is, Json, Time, c } from './libs.ts';
import type * as t from './t.ts';

const ENV = {
  ENABLED: 'SYS_DRIVER_VITE_PERF',
  EPOCH: 'SYS_DRIVER_VITE_PERF_EPOCH',
} as const;

type PerfLevel = 0 | 1 | 2 | 3;

type PerfState = {
  level: PerfLevel;
  epoch: t.Msecs;
  samples: Map<string, { count: number; total: t.Msecs }>;
  seen: Set<string>;
};

type PerfMeta = Record<string, unknown>;
type PerfOptions = {
  level?: PerfLevel;
  dedupeKey?: string;
  thresholdMs?: t.Msecs;
};

type PerfGlobal = typeof globalThis & {
  __sysDriverVitePerfState__?: PerfState;
};

export const Perf = {
  enabled(level: PerfLevel = 1) {
    return Perf.level() >= level;
  },

  level() {
    return perf.state().level;
  },

  epoch() {
    return perf.state().epoch;
  },

  childEnv(): Record<string, string> {
    if (!Perf.enabled()) return {};
    return {
      [ENV.ENABLED]: String(Perf.level()),
      [ENV.EPOCH]: String(Perf.epoch()),
    };
  },

  sinceStart() {
    return Time.elapsed(Perf.epoch()).msec;
  },

  log(label: string, meta: PerfMeta = {}, options: PerfOptions = {}) {
    const level = options.level ?? 1;
    if (!Perf.enabled(level)) return;
    if (!perf.markSeen(options.dedupeKey)) return;

    const sinceStart = Perf.sinceStart();
    const suffix = perf.meta(meta);
    console.info(`${perf.prefix(sinceStart, level)} ${label}${suffix}`);
  },

  sample(label: string, elapsed: t.Msecs, meta: PerfMeta = {}, options: PerfOptions = {}) {
    const threshold = options.thresholdMs ?? (0 as t.Msecs);
    if (elapsed < threshold) return;
    if (!Perf.enabled(options.level ?? 1)) return;

    const summary = perf.record(label, elapsed);
    Perf.log(label, {
      elapsed,
      count: summary.count,
      total: summary.total,
      ...meta,
    }, options);
  },

  section(label: string, meta: PerfMeta = {}, options: PerfOptions = {}) {
    const startedAt = Time.now.timestamp as t.Msecs;
    return (extra: PerfMeta = {}) => {
      const elapsed = Time.elapsed(startedAt).msec;
      Perf.sample(label, elapsed, { ...meta, ...extra }, options);
      return elapsed;
    };
  },

  async measure<T>(label: string, run: () => Promise<T>, meta: PerfMeta = {}, options: PerfOptions = {}): Promise<T> {
    const end = Perf.section(label, meta, options);
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

    const level = perf.levelFromEnv(Deno.env.get(ENV.ENABLED));
    const epoch = perf.epochFromEnv(Deno.env.get(ENV.EPOCH)) ?? (Time.now.timestamp as t.Msecs);
    const state: PerfState = { level, epoch, samples: new Map(), seen: new Set() };
    root.__sysDriverVitePerfState__ = state;
    return state;
  },

  levelFromEnv(value?: string | null): PerfLevel {
    if (!Is.string(value)) return 0;
    const normalized = value.trim().toLowerCase();
    if (normalized === '' || normalized === '0' || normalized === 'false' || normalized === 'off' || normalized === 'no') return 0;
    if (normalized === '1' || normalized === 'true' || normalized === 'on' || normalized === 'yes') return 1;
    if (normalized === '2') return 2;
    if (normalized === '3') return 3;

    const parsed = Number(normalized);
    if (!Number.isFinite(parsed)) return 1;
    if (parsed <= 0) return 0;
    if (parsed >= 3) return 3;
    return parsed >= 2 ? 2 : 1;
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

  markSeen(key?: string) {
    if (!Is.str(key) || key === '') return true;
    const state = perf.state();
    if (state.seen.has(key)) return false;
    state.seen.add(key);
    return true;
  },

  prefix(sinceStart: t.Msecs, level: PerfLevel) {
    const pid = level >= 2 ? ` p=${Deno.pid}` : '';
    return `${c.gray('[')}${c.cyan('driver-vite:perf')} ${c.gray(`+${sinceStart}ms${pid}`)}${c.gray(']')}`;
  },
} as const;
