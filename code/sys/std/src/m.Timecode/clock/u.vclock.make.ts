import { type t, Num } from '../common.ts';
import { VTime } from './m.VTime.ts';

type MappedSouceInner = {
  index: number;
  seg: t.TimecodeResolvedSegment;
  srcTime: t.Msecs;
  offset: t.Msecs;
};

/**
 * Construct a VirtualClock when only a total duration is known.
 *
 * - No segments are provided
 * - mapToSource() will always return null
 *
 * This helper formalizes the "total-only" clock contract and avoids
 * ad-hoc or implicit timeline shaping at call sites.
 */
export const makeForTotal: t.VirtualClockLib['makeForTotal'] = (total, opts) => {
  return make({ total, segments: [] }, opts);
};

/**
 * Virtual clock: pure, framework-free implementation.
 * - Exclusive end semantics: [0,total)
 * - Caller drives progression via `advance(deltaMsecs)` — the elapsed real time in milliseconds
 * - `get()` returns an immutable snapshot; methods mutate internal clock state.
 */
export const make: t.VirtualClockLib['make'] = (timeline, opts = {}) => {
  const total: t.Msecs = Math.max(0, Number(timeline?.total ?? 0));
  const loop = Boolean(opts?.loop);
  let speed = saneSpeed(opts?.speed);

  const startAt: t.Msecs = opts?.startAt ?? (0 as t.Msecs);
  let vtime = clamp(VTime.fromMsecs(startAt), total);
  let playing = true; // default "autoPlay" behavior at core level

  // Cache for current segment mapping
  let map = mapToSourceInner(vtime, timeline);

  const snapshot = (): t.VirtualClockState => ({
    vtime,
    index: map?.index ?? -1,
    seg: map?.seg ?? undefined,
    playing,
  });

  const api: t.VirtualClock = {
    get: snapshot,

    play() {
      playing = true;
      return snapshot();
    },

    pause() {
      playing = false;
      return snapshot();
    },

    seek(v) {
      vtime = clamp(v, total);
      map = mapToSourceInner(vtime, timeline);
      return snapshot();
    },

    setSpeed(n) {
      speed = saneSpeed(n);
      return snapshot();
    },

    advance(delta) {
      if (!playing || total <= 0) return snapshot();

      const dt: t.Msecs = Math.max(0, Number(delta)) * speed;

      if (loop && total > 0) {
        const nextMs = VTime.toMsecs(vtime) + dt;
        const wrapped = nextMs % Number(total);
        vtime = VTime.fromMsecs(wrapped);
        map = mapToSourceInner(vtime, timeline);
        return snapshot();
      }

      const next = clamp(VTime.fromMsecs(VTime.toMsecs(vtime) + dt), total);

      if (next !== vtime) {
        vtime = next;
        map = mapToSourceInner(vtime, timeline);
      }

      // End handling (exclusive end)
      if (Number(vtime) >= Number(total) - 1) {
        if (loop && total > 0) {
          vtime = VTime.zero; // restart
          map = mapToSourceInner(vtime, timeline);
        } else {
          playing = false;
        }
      }

      return snapshot();
    },

    mapToSource(v) {
      const m = mapToSourceInner(v, timeline);
      return m ? { index: m.index, seg: m.seg, srcTime: m.srcTime, offset: m.offset } : null;
    },
  };

  return api;
};

/**
 * Helpers:
 */

/** Clamp v into [0,total). */
function clamp(v: t.VTime, total: t.Msecs): t.VTime {
  const tot = Number(total);
  if (!isFinite(tot) || tot <= 0) return VTime.zero;
  const max = (tot - 1) as number;
  const n = Num.clamp(0, max, Number(v));
  return VTime.fromMsecs(n);
}

/** Safe speed scalar. */
function saneSpeed(n: number | undefined): number {
  const x = Number(n);
  if (!isFinite(x)) return 1;
  if (x < 0) return 0;
  return x === 0 ? 0 : x;
}

/** Map virtual time → segment + source time. */
function mapToSourceInner(
  v: t.VTime,
  timeline: t.TimecodeCompositionResolved | undefined,
): MappedSouceInner | null {
  const segs = timeline?.segments ?? [];
  if (segs.length === 0) return null;

  const vv = Number(v);
  // Linear scan (timelines are typically small; upgrade to binary search if needed)
  for (let i = 0; i < segs.length; i++) {
    const s = segs[i];
    const vFrom = Number(s.virtual.from);
    const vTo = Number(s.virtual.to);
    if (vv >= vFrom && vv < vTo) {
      const offset = vv - vFrom;
      const srcTime = Number(s.original.from) + Number(offset);
      return { index: i, seg: s, srcTime, offset };
    }
  }
  return null;
}
