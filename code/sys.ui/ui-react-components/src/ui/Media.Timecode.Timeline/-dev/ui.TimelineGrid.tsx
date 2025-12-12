import React from 'react';
import { type t, Bullet, Color, css, dur, ObjectView, Timecode } from '../common.ts';

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
  const COLS = `10px 30px 40px 1fr 150px`;
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
      // borderBottom: `1px solid ${Color.alpha(theme.fg, 0.18)}`,
      color: Color.alpha(theme.fg, 0.75),
      columnGap: 12,

      position: 'sticky',
      top: 0,
      zIndex: 2,

      backdropFilter: 'blur(6px)',
      WebkitBackdropFilter: 'blur(6px)',
      boxShadow: `0 4px 10px ${Color.alpha(theme.fg, 0.15)}`,
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
    rowSelected: css({ backgroundColor: Color.alpha(Color.BLUE, 0.3) }),
    cellText: css({
      display: 'flex',
      alignItems: 'center',
      paddingTop: 1,
      paddingBottom: 1,
    }),
    cellPayload: css({}),
    media: css({
      minWidth: 0,
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      color: theme.fg,
    }),
    mediaRepeat: css({
      color: Color.alpha(theme.fg, 0.3),
    }),
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

    return timeline.beats.map((beat, index) => {
      const logicalPath = beat.src.ref;
      const mediaLabel = logicalPath.split('/').pop() || logicalPath;
      const isRepeat = mediaLabel === lastMediaLabel;
      lastMediaLabel = mediaLabel;

      const payload = <ObjectView data={beat.payload} theme={theme.name} fontSize={10} />;

      return {
        index,
        beat,
        vTime: dur(beat.vTime),
        pause: beat.pause ? dur(beat.pause) : '-',
        logicalPath,
        mediaLabel,
        payload,
        isRepeat,
      };
    });
  }, [bundle, theme.name]);

  const elRows = rows.map((row) => {
    const { beat, index } = row;
    const isSelected = index === props.selectedIndex;

    const rowClass = css(styles.row, isSelected && styles.rowSelected).class;
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
        onPointerDown={() => {
          props.onSelect?.({ index, beat });
        }}
      >
        <div className={styles.cellIndex.class}>
          <Bullet theme={theme.name} selected={isSelected} />
        </div>
        <div className={styles.cellText.class}>{row.vTime}</div>
        <div className={styles.cellText.class}>{row.pause}</div>
        <div className={mediaClass} title={row.logicalPath}>
          {row.mediaLabel}
        </div>
        <div className={styles.cellPayload.class}>{row.payload}</div>
      </div>
    );
  });

  const elHeader = (
    <div className={styles.header.class}>
      <div></div>
      <div>vTime</div>
      <div>Pause</div>
      <div>Media</div>
      <div>Payload</div>
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
// 🌸 ---------- /CHANGED ----------
