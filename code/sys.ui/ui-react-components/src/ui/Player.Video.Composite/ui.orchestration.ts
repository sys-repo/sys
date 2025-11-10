import type { t } from './common.ts';
import { Helpers } from './m.Composite.helpers.ts';

type VideoRefs = { live: HTMLVideoElement; next: HTMLVideoElement };
type OrchestratorDeps = {
  refs: VideoRefs;
  resolved: t.VideoCompositionResolved;
  handoffMs?: t.Msecs; // default 250
  onTime?: (v: t.VideoVTime) => void;
  onEnded?: () => void;
};

const secsToMs = (s: number) => (s * 1000) as t.Msecs;

export function attach(o: OrchestratorDeps) {
  let v: t.VideoVTime = 0 as t.Msecs;
  let idx = -1;

  const tick = (secs: number) => {
    v = (vFromLive() + secsToMs(secs)) as t.VideoVTime;
    o.onTime?.(v);
    maybePrepareNext();
    maybeHandoff();
  };

  function vFromLive(): t.Msecs {
    const r = Helpers.mapToSource(o.resolved.segments, v);
    return (r?.seg?.vFrom ?? 0) as t.Msecs;
  }

  function maybePrepareNext() {
    const r = Helpers.mapToSource(o.resolved.segments, v);
    if (!r) return;
    if (r.index !== idx) {
      idx = r.index;
    } // track current segment

    const nextIdx = Helpers.cursor(o.resolved).next(idx);
    if (nextIdx == null) return;
    const nextSeg = o.resolved.segments[nextIdx];
    const { next } = o.refs;

    if (next.src !== nextSeg.src) {
      next.src = nextSeg.src;
      next.preload = 'auto';
      next.load();
    }

    // prime position; don't play yet
    setCurrentTimeSafely(next, nextSeg.from);
  }

  function maybeHandoff() {
    const r = Helpers.mapToSource(o.resolved.segments, v);
    if (!r) return;

    const remaining = (r.seg.vTo - v) as t.Msecs;
    const handoffMs = (o.handoffMs ?? (250 as t.Msecs)) as t.Msecs;

    if (remaining <= handoffMs) {
      const { live, next } = o.refs;
      const nextIdx = Helpers.cursor(o.resolved).next(r.index);
      if (nextIdx == null) {
        o.onEnded?.();
        return;
      }
      const nextSeg = o.resolved.segments[nextIdx];

      // finalize alignment and swap
      setCurrentTimeSafely(next, nextSeg.from);
      live.pause();
      void next.play();
      swapRefs(o.refs);
      idx = nextIdx;
    }
  }

  return { tick };
}

/**
 * Swap the live/next elements in-place on the refs object.
 */
function swapRefs(refs: VideoRefs) {
  const a = refs.live;
  refs.live = refs.next;
  refs.next = a;
}

/**
 * Seek a video element when metadata is ready; avoids DOMException on some browsers.
 */
function setCurrentTimeSafely(video: HTMLVideoElement, ms: t.Msecs) {
  const set = () => {
    // clamp into [0, duration] just in case
    const durMs = Number.isFinite(video.duration)
      ? ((video.duration * 1000) as t.Msecs)
      : (0 as t.Msecs);
    const clamped = durMs > 0 ? (Math.max(0, Math.min(ms, durMs)) as t.Msecs) : ms;
    video.currentTime = Number(clamped) / 1000;
  };

  // readyState >= HAVE_METADATA (1) is enough to set currentTime safely
  if (video.readyState >= 1) {
    set();
  } else {
    const onMeta = () => {
      video.removeEventListener('loadedmetadata', onMeta);
      set();
    };
    video.addEventListener('loadedmetadata', onMeta, { once: true });
  }
}
