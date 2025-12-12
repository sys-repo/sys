import React from 'react';
import { type t, Bullet, Color, css, dur, Path, Timecode } from '../common.ts';
import { useTimeline } from '../use.Timeline.ts';
import { A } from './ui.A.tsx';

export type MediaTimelineGridProps = {
  debug?: boolean;
  bundle?: t.SpecTimelineBundle;
  selectedIndex?: t.Index;
  theme?: t.CommonTheme;
  style?: t.CssInput;
  onSelect?: (e: { beat: t.Timecode.Experience.Beat; index: t.Index }) => void;
};

export const Grid: React.FC<MediaTimelineGridProps> = (props) => {
  const { bundle, selectedIndex } = props;
  const { timeline } = useTimeline(bundle?.spec);

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const COLS = `10px 80px 30px 40px 70px 1fr`;
  const styles = {
    base: css({
      position: 'relative',
      color: theme.fg,
      fontSize: 10,
      fontFamily: 'monospace',
      userSelect: 'none',
    }),
    body: css({ Absolute: 0, Scroll: true }),
    header: css({
      display: 'grid',
      gridTemplateColumns: COLS,
      padding: '4px 10px',
      fontSize: 10,
      letterSpacing: 0.06,
      color: Color.alpha(theme.fg, 0.75),
      columnGap: 16,

      position: 'sticky',
      top: 0,
      zIndex: 2,

      // Glassy overlay:
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
      columnGap: 16,
      alignItems: 'start',
      transition: 'background-color 100ms ease-out',
    }),
    cell: {
      text: css({ display: 'flex', alignItems: 'center', paddingTop: 1, paddingBottom: 1 }),
      bullet: css({
        alignSelf: 'start',
        display: 'flex',
        alignItems: 'center',
        paddingTop: 4,
        color: Color.alpha(theme.fg, 0.6),
        columnGap: 8,
      }),
      media: css({
        minWidth: 0,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }),
    },
  } as const;

  /**
   * Derive row model.
   */
  const rows = React.useMemo(() => {
    if (!bundle || !timeline) return [];

    let lastMediaLabel: string | undefined;
    let prevVTime: t.Msecs | undefined;

    return timeline.beats.map((beat, index) => {
      const logicalPath = beat.src.ref;
      const mediaLabel = logicalPath.split('/').pop() || logicalPath;
      const isRepeat = mediaLabel === lastMediaLabel;
      lastMediaLabel = mediaLabel;

      const segmentId = mediaLabel;
      const isSegmentStart = index === 0 || !isRepeat;

      const url = bundle.resolveMedia({ kind: 'video', logicalPath });
      const vtt = Timecode.format(beat.vTime, { withMillis: true, forceHours: true });

      const deltaMs = prevVTime === undefined ? undefined : beat.vTime - prevVTime;
      const delta = deltaMs === undefined ? '-' : dur(deltaMs);
      prevVTime = beat.vTime;

      return {
        index,
        beat,
        vtt,
        vTime: delta,
        is: { repeat: isRepeat, segmentStart: isSegmentStart },
        pause: beat.pause ? dur(beat.pause) : '-',
        logicalPath,
        mediaLabel,
        segmentId,
        url,
      };
    });
  }, [bundle, timeline]);

  // Selection:
  const selectedRow = selectedIndex === undefined ? undefined : rows[selectedIndex];
  const selectedSegmentId = selectedRow?.segmentId;

  type RowModel = (typeof rows)[number];
  const deriveRowView = (row: RowModel) => {
    const isSelected = row.index === selectedIndex;
    const isNewSegmentRow = !row.is.repeat && row.index > 0; // ← guard first row
    const isInSelectedSegment = selectedSegmentId === row.segmentId;
    const isSecondaryRow = row.is.repeat || (isInSelectedSegment && row.is.segmentStart);
    const isMediaDimmed = isSecondaryRow && !isSelected;
    return { isSelected, isNewSegmentRow, isMediaDimmed } as const;
  };

  /**
   * Build row elements:
   */
  const elRows = rows.map((row) => {
    const { beat, index } = row;
    const { isSelected, isNewSegmentRow, isMediaDimmed } = deriveRowView(row);
    const rowStyles = {
      base: css({
        borderTop: isNewSegmentRow ? `dashed 1px ${Color.alpha(Color.BLUE, 0.7)}` : undefined,
        backgroundColor: isSelected ? Color.alpha(Color.BLUE, 0.3) : undefined,

        // Repeat rows recede (nice information visual):
        color: isMediaDimmed ? Color.alpha(theme.fg, 0.18) : undefined,
      }),

      // Media cell no longer needs special dim logic.
      media: css(styles.cell.text, styles.cell.media),
    };

    const linkNewTab = (url: t.StringUrl, label: string = url) => {
      return <A href={url} children={label} target={'_blank'} />;
    };

    const linkLabel = `media${Path.extname(row.url ?? '')}`.replace(/\./, '/');

    return (
      <div
        key={row.index}
        data-index={row.index}
        className={css(styles.row, rowStyles.base).class}
        onPointerDown={() => props.onSelect?.({ index, beat })}
      >
        <div className={styles.cell.bullet.class}>
          <Bullet theme={theme.name} selected={isSelected} />
        </div>
        <div className={styles.cell.text.class}>{row.vtt}</div>
        <div className={styles.cell.text.class}>{row.vTime}</div>
        <div className={styles.cell.text.class}>{row.pause}</div>
        <div className={rowStyles.media.class} title={row.url}>
          {row.url && linkNewTab(row.url, linkLabel)}
          {!row.url && '-'}
        </div>
        <div className={rowStyles.media.class} title={row.logicalPath}>
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
      <div>URL</div>
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
