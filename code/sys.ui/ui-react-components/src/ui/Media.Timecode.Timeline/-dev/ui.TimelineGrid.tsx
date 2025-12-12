import React from 'react';
import { type t, Bullet, Color, css, dur, Timecode } from '../common.ts';

export type MediaTimelineGridProps = {
  debug?: boolean;
  bundle?: t.SpecTimelineBundle;
  selectedIndex?: t.Index;
  theme?: t.CommonTheme;
  style?: t.CssInput;
  onSelect?: (e: { beat: t.Timecode.Experience.Beat; index: t.Index }) => void;
};

export const TimelineGrid: React.FC<MediaTimelineGridProps> = (props) => {
  const { debug = false, bundle } = props;
  const theme = Color.theme(props.theme);

  if (!bundle) return null;

  /**
   * Render:
   */
  const COLS = `10px 80px 30px 40px 1fr`;
  const styles = {
    base: css({
      position: 'relative',
      backgroundColor: Color.ruby(debug),
      color: theme.fg,
      fontSize: 10,
      fontFamily: 'monospace',
    }),
    body: css({ Absolute: 0, Scroll: true }),
    header: css({
      display: 'grid',
      gridTemplateColumns: COLS,
      padding: '4px 10px',
      fontSize: 10,
      letterSpacing: 0.06,
      color: Color.alpha(theme.fg, 0.75),
      columnGap: 12,

      position: 'sticky',
      top: 0,
      zIndex: 2,

      // glassy overlay
      backgroundColor: Color.alpha(theme.bg, 0.65),
      backdropFilter: 'blur(8px)',
      borderBottom: `solid 1px ${Color.alpha(theme.fg, 0.16)}`,
      boxShadow: `0 1px 0 ${Color.alpha(theme.bg, 0.7)}`,
    }),
    row: css({
      display: 'grid',
      gridTemplateColumns: COLS,
      padding: '2px 10px',
      cursor: 'default',
      columnGap: 12,
      alignItems: 'start',
      transition: 'background-color 100ms ease-out',
    }),
    rowNew: css({
      borderTop: `dashed 1px ${Color.alpha(Color.BLUE, 0.7)}`,
    }),
    rowSelected: css({
      backgroundColor: Color.alpha(Color.BLUE, 0.3),
    }),
    cellText: css({
      display: 'flex',
      alignItems: 'center',
      paddingTop: 1,
      paddingBottom: 1,
    }),
    media: css({
      minWidth: 0,
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      color: theme.fg,
    }),
    mediaRepeat: css({ color: Color.alpha(theme.fg, 0.18) }),
    cellIndex: css({
      alignSelf: 'start',
      display: 'flex',
      alignItems: 'center',
      paddingTop: 4,
      color: Color.alpha(theme.fg, 0.6),
      columnGap: 8,
    }),
  } as const;

  const rows = React.useMemo(() => {
    const { spec } = bundle;
    const composite = Timecode.Composite.toVirtualTimeline(spec.composition);
    const timeline = Timecode.Experience.toTimeline(composite, spec.beats);
    let lastMediaLabel: string | undefined;
    let prevVTime: t.Msecs | undefined;

    return timeline.beats.map((beat, index) => {
      const logicalPath = beat.src.ref;
      const mediaLabel = logicalPath.split('/').pop() || logicalPath;
      const isRepeat = mediaLabel === lastMediaLabel;
      lastMediaLabel = mediaLabel;

      const vtt = Timecode.format(beat.vTime, {
        withMillis: true,
        forceHours: true,
      });

      const deltaMs = prevVTime === undefined ? undefined : beat.vTime - prevVTime;
      prevVTime = beat.vTime;
      const delta = deltaMs === undefined ? '-' : dur(deltaMs);

      return {
        index,
        beat,
        vtt,
        vTime: delta,
        pause: beat.pause ? dur(beat.pause) : '-',
        logicalPath,
        mediaLabel,
        isRepeat,
      };
    });
  }, [bundle, theme.name]);

  const elRows = rows.map((row) => {
    const { beat, index } = row;
    const isSelected = index === props.selectedIndex;

    const rowClass = css(
      styles.row,
      !row.isRepeat && index > 0 && styles.rowNew, // ← guard first row
      isSelected && styles.rowSelected,
    ).class;

    const mediaClass = css(
      styles.cellText,
      styles.media,
      row.isRepeat && !isSelected && styles.mediaRepeat,
    ).class;

    return (
      <div
        key={row.index}
        data-index={row.index}
        className={rowClass}
        onPointerDown={() => props.onSelect?.({ index, beat })}
      >
        <div className={styles.cellIndex.class}>
          <Bullet theme={theme.name} selected={isSelected} />
        </div>
        <div className={styles.cellText.class}>{row.vtt}</div>
        <div className={styles.cellText.class}>{row.vTime}</div>
        <div className={styles.cellText.class}>{row.pause}</div>
        <div className={mediaClass} title={row.logicalPath}>
          {row.mediaLabel}
        </div>
      </div>
    );
  });

  const elHeader = (
    <div className={styles.header.class}>
      <div></div>
      <div>vTime</div>
      <div></div>
      <div>Pause</div>
      <div>Media</div>
    </div>
  );

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={styles.body.class}>
        {elHeader}
        {elRows}
      </div>
    </div>
  );
};
