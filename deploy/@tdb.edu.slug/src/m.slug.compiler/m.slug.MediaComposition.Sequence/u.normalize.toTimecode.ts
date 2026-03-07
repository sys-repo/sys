import type { t } from './common.ts';

export const toTimecode: t.SlugSequenceNormalizeLib['toTimecode'] = (
  sequence: t.SequenceItem[],
  opts = {},
) => {
  const { docid, yamlPath } = opts;
  const timecode: t.Timecode.Composite.Spec = [];
  const beats: t.SequenceBeat[] = [];

  for (const item of sequence) {
    if (isVideoItem(item)) {
      const src = String(item.video).trim();
      if (!src) continue;

      // Structural piece for the composite timeline.
      timecode.push({
        src: src as t.StringRef,
        slice: item.slice,
      });

      // Timestamps on the video → beats.
      if (item.timestamps) {
        pushBeatsFromTimestamps({
          srcRef: src,
          timestamps: item.timestamps,
          out: beats,
        });
      }

      // NOTE: For now we do not attach anything from `title`/`script` here.
      continue;
    }

    if (isSlugItem(item)) {
      // For now we do not project slug items into t.Timecode.Composite.Spec.
      // Their timestamps are also skipped at this layer until we have a
      // clear story for slug-resolution into concrete media.
      continue;
    }

    if (isPauseItem(item)) {
      // Top-level pauses are currently ignored by this normalizer.
      // The pause semantics will eventually be expressed via beats,
      // likely anchored to adjacent media segments.
      continue;
    }

    if (isImageItem(item)) {
      // Image items represent overlay-driven moments whose structural
      // duration and anchoring are not yet modelled in TimecodeComposite.
      // We deliberately ignore them here until the image timeline story
      // is fully specified.
      continue;
    }
  }

  /**
   * Result:
   */
  const api: t.SequenceNormalized = {
    timecode,
    beats,
    meta: { docid, path: yamlPath ? { yaml: yamlPath } : undefined },
  };
  return api;
};

/**
 * Video item type guard.
 */
function isVideoItem(item: t.SequenceItem): item is t.SequenceVideoItem {
  return (item as t.SequenceVideoItem).video !== undefined;
}

/**
 * Slug item type guard.
 */
function isSlugItem(item: t.SequenceItem): item is t.SequenceItem {
  return (item as t.SequenceEmbedItem).slug !== undefined;
}

/**
 * Pause item type guard.
 *
 * (Distinct from video items, which may also have timestamps with pauses.)
 */
function isPauseItem(item: t.SequenceItem): item is t.SequencePauseItem {
  return (
    (item as t.SequencePauseItem).pause !== undefined &&
    (item as t.SequenceVideoItem).video === undefined &&
    (item as t.SequenceEmbedItem).slug === undefined &&
    (item as t.SequenceImageItem).image === undefined
  );
}

/**
 * Image item type guard.
 */
function isImageItem(item: t.SequenceItem): item is t.SequenceImageItem {
  return (item as t.SequenceImageItem).image !== undefined;
}

/**
 * Derive beats from a `timestamps` map and append them to the output list.
 *
 * - Keys are WebVTT timecodes like "00:00:03" or "01:02:03.500".
 * - Values are `SequenceTimestampEntry` objects.
 * - We convert keys into `t.Msecs` and keep the payload local to the sequence domain.
 */
function pushBeatsFromTimestamps(args: {
  readonly srcRef: string;
  readonly timestamps: t.SequenceTimestamps;
  readonly out: t.SequenceBeat[];
}): void {
  const { srcRef, timestamps, out } = args;

  for (const [timecode, entry] of Object.entries(timestamps)) {
    const ms = parseTimecodeToMs(timecode);
    if (ms == null) continue; // Guard: silently drop malformed keys.

    const pause = entry.pause ? parsePauseToMs(entry.pause) : undefined;

    const payload: t.SequenceBeatPayload = {
      title: entry.title,
      image: entry.image,
      text: entry.text
        ? {
            headline: entry.text.headline,
            tagline: entry.text.tagline,
            body: entry.text.body,
          }
        : undefined,
    };

    out.push({
      src: {
        ref: srcRef as t.StringRef,
        time: ms as t.Msecs,
      },
      pause,
      payload,
    });
  }
}

/**
 * Parse a pause string like "2s" or "3.5s" into milliseconds.
 *
 * Intentionally *narrow* grammar:
 *   - "<number>s" → seconds
 *   - Optional surrounding whitespace is allowed.
 */
function parsePauseToMs(input: string): t.Msecs | undefined {
  const m = /^\s*(\d+(?:\.\d+)?)s\s*$/i.exec(input);
  if (!m) return undefined;
  const seconds = Number(m[1]);
  if (!Number.isFinite(seconds) || seconds < 0) return undefined;
  return (seconds * 1000) as t.Msecs;
}

/**
 * Minimal WebVTT-like timecode parser, mirroring the composite layer:
 *
 *   "HH:MM:SS(.mmm)" or "MM:SS(.mmm)" → milliseconds
 *
 * Returns `undefined` for invalid forms.
 */
function parseTimecodeToMs(input: string): number | undefined {
  const s = input.trim();
  const m = /^(\d{1,2}:)?([0-5]?\d):([0-5]?\d)(\.\d{1,3})?$/.exec(s);
  if (!m) return undefined;

  const hasHours = !!m[1];
  const h = hasHours ? Number(m[1].slice(0, -1)) : 0;
  const min = Number(m[2]);
  const sec = Number(m[3]);
  const frac = m[4] ? Number(m[4].slice(1).padEnd(3, '0')) : 0;

  if (
    !Number.isFinite(h) ||
    !Number.isFinite(min) ||
    !Number.isFinite(sec) ||
    !Number.isFinite(frac)
  ) {
    return undefined;
  }
  if (min > 59 || sec > 59 || h < 0 || min < 0 || sec < 0 || frac < 0) {
    return undefined;
  }

  return h * 3600000 + min * 60000 + sec * 1000 + frac;
}
