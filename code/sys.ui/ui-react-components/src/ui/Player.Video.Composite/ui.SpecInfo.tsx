import React from 'react';
import { type t, KeyValue, Str, Time, Timecode } from './common.ts';

type P = t.CompositeVideoSpecInfoProps;

/**
 * Key/Value summary of a `TimecodeCompositionSpec`.
 * Uses only `videos` and `Timecode.Composite` helpers (no media, no player).
 */
export const SpecInfo: React.FC<P> = (props) => {
  const { layout, size = 'sm', mono = true, theme } = props;

  const items = React.useMemo<t.KeyValueItem[]>(
    () => toItems(props),
    [props.videos, props.ellipsize],
  );

  return (
    <KeyValue.View
      items={items}
      layout={layout ?? { kind: 'table', keyAlign: 'left', columnGap: 10, rowGap: 6 }}
      size={size}
      mono={mono}
      theme={theme}
      style={props.style}
    />
  );
};

/**
 * Build concise rows for each segment of the timeline.
 */
function toItems(props: P): t.KeyValueItem[] {
  const { videos = [], ellipsize = [20, 20] } = props;

  const timeline = Timecode.Composite.toVirtualTimeline(videos);
  const rows: t.KeyValueItem[] = [];

  rows.push({ kind: 'title', v: 'Composite Video' });
  rows.push(kv('total', timeline.total > 0 ? dur(timeline.total) : '-'));
  rows.push({ kind: 'hr' });

  videos.forEach((piece, i) => {
    const n = i + 1;
    const src = piece.src?.trim() ?? '';
    const rawSlice = piece.slice ? String(piece.slice).trim() : undefined;

    const indent = 10;
    rows.push({ kind: 'title', v: `Segment ${n}` });
    rows.push(kv('src', Str.ellipsize(src, ellipsize, '..'), indent));

    if (rawSlice) {
      const canonical = rawSlice ? Timecode.Slice.toString(rawSlice) : '';
      let displaySlice = canonical || rawSlice;
      rows.push(kv('slice', displaySlice, indent));
    }

    const seg = timeline?.segments?.[i];
    if (seg) {
      const v = seg.virtual;
      const s = seg.original;
      rows.push(kv('virtual', `${dur(v.from)} → ${dur(v.to)}  (${span(v)})`, indent));
      rows.push(kv('source', `${dur(s.from)} → ${dur(s.to)}  (${span(s)})`, indent));
    }

    if (n < videos.length) rows.push({ kind: 'spacer', size: 3 });
  });

  return rows;
}

/**
 * Helpers:
 */
function kv(k: React.ReactNode, v?: React.ReactNode, indent?: number): t.KeyValueRow {
  return { k, v, truncate: true, x: indent };
}

function dur(ms: t.Msecs, round = 0): string {
  return Time.Duration.create(ms, { round }).toString();
}

function span(span: t.MsecSpan, round = 0): string {
  return dur(span.to - span.from, round);
}
