import React from 'react';
import { type t, Bullet, Color, css, dur, Timecode, Icons } from '../common.ts';
import { useTimeline } from '../use.Timeline.ts';
import { A } from './ui.A.tsx';

export type GridProps = {
  debug?: boolean;
  bundle?: t.SpecTimelineBundle;
  selectedIndex?: t.Index;
  theme?: t.CommonTheme;
  style?: t.CssInput;
  onSelect?: SelectIndexHandler;
};

export type SelectIndexHandler = (e: SelectIndex) => void;
export type SelectIndex = { readonly index: t.TimecodeState.Playback.BeatIndex };

export const Grid: React.FC<GridProps> = (props) => {
  const { bundle, selectedIndex } = props;
  const { timeline } = useTimeline(bundle?.spec);

  /**
   * Render:
   */
  const COLS = `10px 80px 30px 30px 120px 1fr`;
  const theme = Color.theme(props.theme);
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

  const ui = {
    color: {
      segBorder: Color.alpha(Color.BLUE, 0.7),
      selectedBg: Color.alpha(Color.BLUE, 0.65),
      segHeaderText: Color.alpha(Color.BLUE, 0.6),
      dimText: Color.alpha(theme.fg, 0.18),
    },
    styles: {
      rowMedia: css({
        position: 'relative',

        // Make the text define height (icon must not).
        display: 'inline-block',
        lineHeight: '1em',

        // Reserve horizontal space so the icon doesn't overlap ellipsis.
        paddingRight: 16,
        minWidth: 0,
      }),
      rowMediaText: css({
        display: 'inline-block',
        minWidth: 0,
      }),
      iconLink: css({
        position: 'absolute',
        right: 0,
        top: '50%',
        transform: 'translateY(-50%)',

        // Ensure the icon doesn't affect line-height / layout.
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        lineHeight: 0,

        textDecoration: 'none',
      }),
      iconBox: css({
        width: 12,
        height: 12,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        lineHeight: 0,
      }),
    } as const,

    linkNewTab(url: t.StringUrl, label: t.ReactNode = url) {
      return <A href={url} children={label} target={'_blank'} style={ui.styles.iconLink} />;
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
    const isInSelectedSegment = selectedSegmentId === row.segmentId;

    const isNewSegmentRow = !row.is.repeat && row.index > 0; // ← guard first row
    const isSecondaryRow = row.is.repeat || (isInSelectedSegment && row.is.segmentStart);
    const isMediaDimmed = !isSelected && isSecondaryRow;

    // Segment header gets dim-blue; Only selection overrides it.
    const isSegmentHeaderBlue = row.is.segmentStart && !isSelected;

    return { isSelected, isNewSegmentRow, isMediaDimmed, isSegmentHeaderBlue } as const;
  };

  /**
   * Build row elements:
   */
  const elRows = rows.map((row) => {
    const { beat, index } = row;
    const { isSelected, isNewSegmentRow, isMediaDimmed, isSegmentHeaderBlue } = deriveRowView(row);
    const isBeforeSelected = selectedIndex !== undefined && row.index < selectedIndex;
    const isVttBright = isBeforeSelected && !isSelected;

    const rowStyles = {
      base: css({
        borderTop: isNewSegmentRow ? `dashed 1px ${ui.color.segBorder}` : undefined,
        backgroundColor: isSelected ? ui.color.selectedBg : undefined,
        color: isSelected
          ? theme.fg
          : isSegmentHeaderBlue
            ? ui.color.segHeaderText
            : isMediaDimmed
              ? ui.color.dimText
              : undefined,
      }),
      media: css(styles.cell.text, styles.cell.media),
      vtt: css(styles.cell.text, isVttBright ? css({ color: theme.fg }) : undefined),
    };

    const elRow = row.url && (
      <span className={ui.styles.rowMedia.class}>
        <span className={ui.styles.rowMediaText.class}>{mediaLabelFromUrl(row.url)}</span>
        {ui.linkNewTab(
          row.url,
          <span className={ui.styles.iconBox.class}>
            <Icons.Link size={12} />
          </span>,
        )}
      </span>
    );

    return (
      <div
        key={row.index}
        data-index={row.index}
        className={css(styles.row, rowStyles.base).class}
        onPointerDown={() => props.onSelect?.({ index })}
      >
        <div className={styles.cell.bullet.class}>
          <Bullet theme={theme.name} selected={isSelected} colorTransition={0} />
        </div>
        <div className={rowStyles.vtt.class}>{row.vtt}</div>
        <div className={styles.cell.text.class}>{row.vTime}</div>
        <div className={styles.cell.text.class}>{row.pause}</div>
        <div className={rowStyles.media.class} title={row.url}>
          {elRow || '-'}
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
      <div>Bundled URL</div>
      <div>Logical Path</div>
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

export function mediaLabelFromUrl(url?: string): string {
  if (!url) return 'media/-';

  const filename = url.split('/').pop();
  if (!filename) return 'media/-';

  const m = filename.match(/^(.*?)(\.[a-z0-9]+)$/i);
  if (!m) return `media/${filename}`;

  const [, stem, ext] = m;

  // Prefer extracting from a "sha256-<hex>" shaped stem.
  const sha = stem.match(/^sha256-([0-9a-f]+)$/i);
  if (sha?.[1]) {
    const hex = sha[1];
    const tail = hex.slice(-5);
    return `media/${tail}${ext}`;
  }

  // Fallback: last 5 hex chars at end of stem.
  const hexTail = stem.match(/([0-9a-f]{5})$/i)?.[1];
  if (hexTail) return `media/${hexTail}${ext}`;

  return `media/${stem}${ext}`;
}
