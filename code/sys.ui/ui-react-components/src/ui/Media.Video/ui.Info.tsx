import React from 'react';
import { type t, Color, css, D } from './common.ts';

type Row = { readonly k: string; readonly v: string };
type Filter = t.MediaVideoStreamProps['debugFilter'];

export type InfoProps = {
  stream?: MediaStream | { readonly raw?: MediaStream; readonly filtered?: MediaStream };
  filter?: Filter;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const Info: React.FC<InfoProps> = (props) => {
  const rows = toRowsFromStream(props.stream, props.filter);

  const styles = {
    base: css({
      // Frosted glass: readable over any video:
      backgroundColor: Color.alpha(Color.WHITE, 0.4),
      backdropFilter: 'blur(30px) saturate(120%)',
      WebkitBackdropFilter: 'blur(16px) saturate(120%)',
      borderRadius: 4,
      Padding: [8, 12],
      fontFamily: 'monospace',
      fontSize: 9.5,
      lineHeight: 1.35,
      color: Color.DARK,
      display: 'grid',
      gap: 6,
      minWidth: 180,
      maxWidth: 360,
    }),
    header: css({ fontWeight: 700, letterSpacing: 0.2, opacity: 0.9 }),
    table: css({
      display: 'grid',
      gridTemplateColumns: 'auto 1fr',
      columnGap: 12,
      rowGap: 4,
      alignItems: 'baseline',
    }),
    key: css({ opacity: 0.7, whiteSpace: 'nowrap' }),
    val: css({ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={styles.header.class}>{D.name}</div>
      <div className={styles.table.class}>
        {rows.map(({ k, v }) => (
          <React.Fragment key={k}>
            <div className={styles.key.class}>{k}</div>
            <div className={styles.val.class}>{v}</div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

/**
 * Helpers:
 */

function toRowsFromStream(input: InfoProps['stream'], filter?: Filter): readonly Row[] {
  if (!input) return [];

  // Normalise to a named pair so the panel can show both if present.
  const pair = input instanceof MediaStream ? { raw: input, filtered: undefined } : input;
  const rows: Row[] = [];
  const push = (k: string, v: unknown) => {
    if (v === undefined) return;
    if (filter && !filter({ key: k })) return;
    rows.push({ k, v: fmt(v) });
  };

  const addStream = (label: 'raw' | 'filtered', s?: MediaStream) => {
    if (!s) return;
    push(`${label}.id`, s.id);

    const vids = s.getVideoTracks();
    const auds = s.getAudioTracks();

    push(`${label}.tracks.video`, vids.length);
    push(`${label}.tracks.audio`, auds.length);

    const vt = vids[0];
    if (vt) {
      const vs = safeSettings(vt);
      push(`${label}.video.label`, vt.label || '(video)');
      push(`${label}.video.ready`, vt.readyState);
      if (vs.width && vs.height) push(`${label}.video.size`, `${vs.width}×${vs.height}`);
      if (vs.frameRate) push(`${label}.video.fps`, vs.frameRate);
      if (vs.aspectRatio) push(`${label}.video.ar`, vs.aspectRatio);
      if (vs.deviceId) push(`${label}.video.device`, vs.deviceId);
    }

    const at = auds[0];
    if (at) {
      const as = safeSettings(at);
      push(`${label}.audio.label`, at.label || '(audio)');
      push(`${label}.audio.ready`, at.readyState);
      if (as.sampleRate) push(`${label}.audio.rate`, `${as.sampleRate}Hz`);
      if (as.channelCount) push(`${label}.audio.channels`, as.channelCount);
      if (as.deviceId) push(`${label}.audio.device`, as.deviceId);
    }
  };

  addStream('raw', pair.raw);
  addStream('filtered', pair.filtered);
  return rows;
}

function safeSettings(track: MediaStreamTrack) {
  try {
    return track.getSettings?.() ?? {};
  } catch {
    return {};
  }
}

function fmt(v: unknown): string {
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'bigint') return String(v);
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  if (v === null) return 'null';
  try {
    const s = JSON.stringify(v);
    return s.length > 80 ? s.slice(0, 77) + '...' : s;
  } catch {
    return '[unserializable]';
  }
}
