import { type t, Time, Timecode } from '../common.ts';
import type { DebugSignals } from './-SPEC.Debug.tsx';
import { loadTimelineFromEndpoint } from './-u.loadTimelineFromEndpoint.ts';

/**
 * Sample data.
 */
export const Sample = {
  load,
  unload,
} as const;

/**
 * Load sample.
 */
async function load(debug: DebugSignals, docid: t.StringId) {
  const video = debug.video;
  const p = debug.props;

  /**
   * SAMPLE 🐷
   */
  const url = 'http://localhost:4040/publish.assets';
  const bundle = await loadTimelineFromEndpoint(url, docid);
  const { spec, resolveMedia } = bundle;

  console.log('docid', `crdt:${docid}`);
  console.log('bundle', bundle);
  console.log('bundle.spec', bundle.spec);
  console.log('bundle.resolveMedia', bundle.resolveMedia);

  // 1. Resolve composite → segments + total + diagnostics.
  const resolved = Timecode.Composite.toVirtualTimeline(spec.composition);

  // 2. Project beats onto the virtual timeline (adds vTime, duration).
  const timeline = Timecode.Experience.toTimeline(resolved, spec.beats);

  console.log('resolved', resolved);
  console.log('timeline', timeline);

  const dur = (ms: t.Msecs = 0) => String(Time.Duration.create(ms));
  const total = {
    duration: dur(timeline.duration),
    beats: timeline.beats.length,
  };
  console.info();
  console.info(` Total Duration ${total.duration} across ${total.beats} beats`);

  const rows = timeline.beats.map((beat, index) => {
    const logicalPath = beat.src.ref;
    const url = resolveMedia({ kind: 'video', logicalPath });
    return {
      'vTime (ms)': beat.vTime,
      'vTime (elapsed)': dur(beat.vTime),
      pause: dur(beat.pause),
      logicalPath,
      url,
      payload: beat.payload,
    };
  });

  console.table(rows);

  /** Update state. */
  p.docid.value = docid;
  p.bundle.value = bundle;
  // video.props.src.value = TMP_URL;
}

/**
 * Unload sample.
 */
function unload(debug: DebugSignals) {
  const video = debug.video;
  const p = debug.props;

  p.docid.value = undefined;
  p.bundle.value = undefined;
  video.props.src.value = undefined;
}
