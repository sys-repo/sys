import type { t } from './common.ts';

export function sequenceToTimecode(
  sequence: t.SequenceItem[],
  opts: { docid?: string; yamlPath?: t.ObjectPath } = {},
): t.SequenceNormalized {
  const { docid, yamlPath } = opts;
  const timecode: t.Timecode.Composite.Spec = [];
  const beats: t.SequenceBeat[] = [];

  for (const item of sequence) {
    if (isVideoItem(item)) {
      const src = String(item.video).trim();
      if (!src) continue;
      timecode.push({ src: src as t.StringRef, slice: item.slice });
      if (item.timestamps) {
        pushBeatsFromTimestamps({ srcRef: src, timestamps: item.timestamps, out: beats });
      }
      continue;
    }
    if (isSlugItem(item) || isPauseItem(item) || isImageItem(item)) continue;
  }

  return {
    timecode,
    beats,
    meta: { docid, path: yamlPath ? { yaml: yamlPath } : undefined },
  };
}

function isVideoItem(item: t.SequenceItem): item is t.SequenceVideoItem {
  return (item as t.SequenceVideoItem).video !== undefined;
}
function isSlugItem(item: t.SequenceItem): item is t.SequenceEmbedItem {
  return (item as t.SequenceEmbedItem).slug !== undefined;
}
function isPauseItem(item: t.SequenceItem): item is t.SequencePauseItem {
  return (
    (item as t.SequencePauseItem).pause !== undefined &&
    (item as t.SequenceVideoItem).video === undefined &&
    (item as t.SequenceEmbedItem).slug === undefined &&
    (item as t.SequenceImageItem).image === undefined
  );
}
function isImageItem(item: t.SequenceItem): item is t.SequenceImageItem {
  return (item as t.SequenceImageItem).image !== undefined;
}

function pushBeatsFromTimestamps(args: {
  readonly srcRef: string;
  readonly timestamps: t.SequenceTimestamps;
  readonly out: t.SequenceBeat[];
}): void {
  const { srcRef, timestamps, out } = args;
  for (const [timecode, entry] of Object.entries(timestamps)) {
    const ms = parseTimecodeToMs(timecode);
    if (ms == null) continue;
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
      src: { ref: srcRef as t.StringRef, time: ms as t.Msecs },
      pause,
      payload,
    });
  }
}

function parsePauseToMs(input: string): t.Msecs | undefined {
  const m = /^\s*(\d+(?:\.\d+)?)s\s*$/i.exec(input);
  if (!m) return undefined;
  const seconds = Number(m[1]);
  if (!Number.isFinite(seconds) || seconds < 0) return undefined;
  return (seconds * 1000) as t.Msecs;
}

function parseTimecodeToMs(input: string): number | undefined {
  const s = input.trim();
  const m = /^(\d{1,2}:)?([0-5]?\d):([0-5]?\d)(\.\d{1,3})?$/.exec(s);
  if (!m) return undefined;
  const hasHours = !!m[1];
  const h = hasHours ? Number(m[1].slice(0, -1)) : 0;
  const min = Number(m[2]);
  const sec = Number(m[3]);
  const frac = m[4] ? Number(m[4].slice(1).padEnd(3, '0')) : 0;
  if (![h, min, sec, frac].every(Number.isFinite)) return undefined;
  if (min > 59 || sec > 59 || h < 0 || min < 0 || sec < 0 || frac < 0) return undefined;
  return h * 3600000 + min * 60000 + sec * 1000 + frac;
}
