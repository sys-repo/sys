import React from 'react';
import { type t, Color, css, Str } from './common.ts';
import { Helpers } from './m.Helpers.ts';

/**
 * Simulated Composite View
 * - No <video>; advances a virtual clock with RAF.
 * - Uses Helpers.{normalize, resolve, mapToSource, Time, cursor} only.
 * - Emits onReady/onTimeUpdate/onEnded like the real thing.
 */
export const CompositeVideo: React.FC<t.CompositeVideoProps> = (props) => {
  const {
    videos,
    durations: durationsProp,
    durationsProbe,
    startAt = 0 as t.VideoVTime,
    handoff = 250 as t.Msecs, // kept for parity; not used in sim other than display
    loop = false,
    playing: playingProp,
    autoPlay = true,
    debug = false,
  } = props;

  // State
  const [resolved, setResolved] = React.useState<t.VideoCompositionResolved>();
  const [index, setIndex] = React.useState<number>(-1);
  const [vtime, setVtime] = React.useState<t.VideoVTime>(0 as t.VideoVTime);
  const [playing, setPlaying] = React.useState<boolean>(Boolean(playingProp ?? autoPlay));

  // Controlled/Uncontrolled playing
  React.useEffect(() => {
    if (playingProp === undefined) return;
    setPlaying(Boolean(playingProp));
  }, [playingProp]);

  // Resolve composition (helpers only)
  React.useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!videos || videos.length === 0) {
        setResolved(undefined);
        setIndex(-1);
        setVtime(0 as t.VideoVTime);
        return;
      }

      const norm = Helpers.normalize(videos);
      const srcs = norm.map((p) => p.src);

      const probeFn =
        durationsProbe ?? (async (ins: readonly string[]) => Helpers.Durations.probe(ins));
      const durations = durationsProp ?? (await probeFn(srcs));

      const r = Helpers.resolve(norm, durations);
      if (cancelled) return;

      const v0 = Helpers.Time.clamp(startAt, r.total);
      const m = Helpers.mapToSource(r.segments, v0) ?? {
        index: r.segments.length ? 0 : -1,
        seg: r.segments[0],
        srcTime: r.segments[0]?.from ?? (0 as t.Msecs),
        offset: 0 as t.Msecs,
      };

      setResolved(r);
      setVtime(v0);
      setIndex(m.index);

      props.onReady?.({ total: r.total, resolved: r });

      if (debug) {
        console.log('[CompositeSim.resolve]', {
          segments: r.segments.length,
          total: r.total,
          issues: Helpers.validate(norm, durations),
        });
      }
    })().catch(() => {});

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videos, durationsProp, durationsProbe, startAt, debug]);

  /**
   * RAF loop: purely virtual time
   * - dt from performance.now
   * - v' = clamp(v + dt, total)
   * - emit onTimeUpdate
   * - at end: loop or onEnded
   */
  React.useEffect(() => {
    if (!resolved || resolved.segments.length === 0) return;

    let raf = 0;
    let last = 0;

    const run = (ts: number) => {
      raf = requestAnimationFrame(run);
      if (!playing) {
        last = ts;
        return;
      }

      if (last === 0) last = ts;
      const dt = Math.max(0, ts - last); // ms
      last = ts;

      const total = resolved.total;
      if (total <= 0) return;

      // advance vtime
      const vNext = Helpers.Time.clamp((vtime + (dt as unknown as t.Msecs)) as t.VideoVTime, total);
      if (vNext !== vtime) setVtime(vNext);

      // map -> emit
      const mapped = Helpers.mapToSource(resolved.segments, vNext);
      if (mapped) {
        if (mapped.index !== index) setIndex(mapped.index);
        props.onTimeUpdate?.({ v: vNext, index: mapped.index, seg: mapped.seg });
      }

      // end / loop
      if (Number(vNext) >= Number(resolved.total) - 1) {
        if (loop) {
          setVtime(0 as t.VideoVTime);
          setIndex(0);
          return;
        } else {
          setPlaying(false);
          props.onEnded?.();
        }
      }
    };

    raf = requestAnimationFrame(run);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolved, playing, loop, vtime, index]);

  // Basic key handlers to poke the sim (optional, dev convenience)
  React.useEffect(() => {
    if (!debug) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        e.preventDefault();
        setPlaying((p) => !p);
      }
      if (e.key === 'ArrowRight' && resolved) {
        const step = 500 as t.Msecs;
        const v = Helpers.Time.clamp((vtime + step) as t.VideoVTime, resolved.total);
        setVtime(v);
      }
      if (e.key === 'ArrowLeft' && resolved) {
        const step = 500 as t.Msecs;
        const v = Helpers.Time.clamp((vtime - step) as t.VideoVTime, resolved.total);
        setVtime(v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [debug, resolved, vtime]);

  // Render (simple overlay of the math)
  const theme = Color.theme(props.theme);
  const ar = props.element?.aspectRatio ?? '16/9';

  const styles = {
    base: css({
      position: 'relative',
      width: '100%',
      aspectRatio: ar,
      minHeight: 220,
      background: Color.alpha(theme.fg, 0.06),
      color: theme.fg,
      borderRadius: props.element?.cornerRadius ?? 8,
      overflow: 'hidden',
      display: 'grid',
      placeItems: 'center',
      fontFamily:
        'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace',
    }),
    hud: css({
      position: 'absolute',
      left: 8,
      bottom: 8,
      padding: '6px 8px',
      fontSize: 12,
      background: 'rgba(0,0,0,0.5)',
      color: 'white',
      borderRadius: 6,
      userSelect: 'none',
      pointerEvents: 'none',
      lineHeight: 1.3,
    }),
    badge: css({
      position: 'absolute',
      top: 8,
      right: 8,
      padding: '4px 8px',
      fontSize: 11,
      borderRadius: 999,
      background: playing ? 'rgba(39,174,96,0.85)' : 'rgba(127,140,141,0.85)',
      color: 'white',
      userSelect: 'none',
    }),
    center: css({
      textAlign: 'center',
      fontSize: 14,
      opacity: 0.8,
    }),
  };

  const mapped =
    resolved && Helpers.mapToSource(resolved.segments, vtime)
      ? (Helpers.mapToSource(resolved.segments, vtime) as t.VideoMapToSourceResult)
      : null;

  const fmtMs = (ms: t.Msecs) => {
    const s = Math.floor(Number(ms) / 1000);
    const m = Math.floor(s / 60);
    const ss = s % 60;
    return `${m}:${String(ss).padStart(2, '0')}`;
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={styles.center.class}>
        <div>Composite Video (Simulated)</div>
        <div style={{ marginTop: 6, fontSize: 12, opacity: 0.7 }}>
          helpers-only • raf clock • no media elements
        </div>
        {!resolved && <div style={{ marginTop: 12 }}>waiting for resolution…</div>}
      </div>

      <div className={styles.badge.class}>{playing ? 'playing' : 'paused'}</div>

      {resolved && (
        <div className={styles.hud.class}>
          <div>
            v={fmtMs(vtime)} / {fmtMs(resolved.total)} • seg={index}
          </div>
          {mapped && (
            <>
              <div>src: ...{mapped.seg.src.slice(-30)}</div>
              <div>
                srcTime={fmtMs(mapped.srcTime)} • slice=[{fmtMs(mapped.seg.from)} ..{' '}
                {fmtMs(mapped.seg.to)}]
              </div>
              <div>
                vSlice=[{fmtMs(mapped.seg.vFrom)} .. {fmtMs(mapped.seg.vTo)}] • handoff≈
                {Number(handoff)}ms
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
