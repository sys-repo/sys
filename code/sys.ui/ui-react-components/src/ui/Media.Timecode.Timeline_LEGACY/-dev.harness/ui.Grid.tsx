import React from 'react';
import { type t, Bullet, Color, css, dur, Icons, Timecode } from '../common.ts';
import { useTimeline } from '../use.Timeline.ts';
import { A } from './ui.A.tsx';

export type GridProps = {
  debug?: boolean;
  bundle?: t.LegacySpecTimelineBundle;
  selectedIndex?: t.Index;
  theme?: t.CommonTheme;
  style?: t.CssInput;
  onSelect?: SelectIndexHandler;

  /**
   * Ephemeral highlight for the selected row:
   * - 'media' → brighten Media
   * - 'pause' → brighten Pause
   */
  activePhase?: GridActivePhase | null;
};

export type GridActivePhase = 'media' | 'pause';
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

      // Ensure this component participates in normal layout (prevents accidental overlay).
      display: 'grid',
      gridTemplateRows: 'auto 1fr',
      minHeight: 0,
    }),
    body: css({
      // Can overlay siblings (eg. the video) depending on parent layout.
      overflowY: 'auto',
      overflowX: 'hidden',
      minHeight: 0,
    }),
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
      dimText: Color.alpha(theme.fg, 0.18),

      // Used ONLY for "new media identity" hinting (URL column only).
      segHeaderText: Color.alpha(Color.BLUE, 0.6),
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

    return timeline.beats.map((beat, index) => {
      const logicalPath = beat.src.ref;
      const mediaLabel = logicalPath.split('/').pop() || logicalPath;
      const isRepeat = mediaLabel === lastMediaLabel;
      lastMediaLabel = mediaLabel;

      const segmentId = mediaLabel;
      const isSegmentStart = index === 0 || !isRepeat;
      const url = bundle.resolveMedia({ kind: 'video', logicalPath });
      const vtt = Timecode.format(beat.vTime, { withMsecs: false, forceHours: true });

      /**
       * Semantics:
       * - totalSpan = curr.vTime → next.vTime (or → timeline end)
       * - mediaSpan = totalSpan - pause
       * - pause = tail-time inside totalSpan
       */
      const next = timeline.beats[index + 1];
      const totalSpanMs = next ? next.vTime - beat.vTime : timeline.duration - beat.vTime;
      const pauseMs = beat.pause ?? 0;
      const mediaSpanMs = Math.max(0, totalSpanMs - pauseMs);

      return {
        index,
        beat,
        vtt,
        media: dur(mediaSpanMs),
        span: dur(totalSpanMs),
        is: { repeat: isRepeat, segmentStart: isSegmentStart },
        pause: pauseMs ? dur(pauseMs) : '-',
        logicalPath,
        mediaLabel,
        segmentId,
        url,
      };
    });
  }, [bundle, timeline]);

  /**
   * Build row elements:
   */
  const elRows = rows.map((row) => {
    const { index } = row;

    /**
     * First-principles style rules:
     * 1) Selection → row background only.
     * 2) Time (past vs future) → bullet fill and vTT brightness.
     * 3) Segment identity ("new file") → URL column only on segment-start rows (blue).
     * 4) Everything else → dim by default (unless selected, or vTT bright).
     */
    const isSelected = row.index === selectedIndex;
    const isBeforeSelected = selectedIndex !== undefined && row.index < selectedIndex;
    const isVttBright = isBeforeSelected && !isSelected;
    const isNewSegmentRow = row.is.segmentStart && row.index > 0; // segment divider only

    const urlColor = isSelected
      ? theme.fg
      : row.is.segmentStart
        ? ui.color.segHeaderText
        : ui.color.dimText;
    const dimColor = ui.color.dimText;

    const isActiveRow = isSelected;
    const activePhase = isActiveRow ? (props.activePhase ?? null) : null;
    const isMediaActive = activePhase === 'media';
    const isPauseActive = activePhase === 'pause';

    const mediaColor = isMediaActive ? theme.fg : dimColor;
    const pauseColor = isPauseActive ? theme.fg : dimColor;

    const rowStyles = {
      base: css({
        borderTop: isNewSegmentRow ? `dashed 1px ${ui.color.segBorder}` : undefined,
        backgroundColor: isSelected ? ui.color.selectedBg : undefined,

        // Non-selected rows are simply dim (no segment-start tinting).
        color: isSelected ? theme.fg : dimColor,
      }),

      // vTT can brighten as the scan aid for “already passed”.
      vtt: css(styles.cell.text, isVttBright ? css({ color: theme.fg }) : undefined),

      // Only the URL column gets the “new file” blue; otherwise it matches the global dim.
      url: css(styles.cell.text, styles.cell.media, css({ color: urlColor })),

      // Logical path never gets special coloring; it follows selected vs dim.
      logical: css(styles.cell.text, styles.cell.media),

      media: css(styles.cell.text, css({ color: mediaColor })),
      pause: css(styles.cell.text, css({ color: pauseColor })),
    };

    const elUrl = row.url && (
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
          <Bullet
            theme={theme.name}
            selected={isSelected}
            filled={isSelected || isVttBright}
            filledColor={Color.alpha(Color.BLUE, 0.5)}
            colorTransition={0}
          />
        </div>

        <div className={rowStyles.vtt.class}>{row.vtt}</div>

        {/* Media = (curr → next) minus pause tail. */}
        <div className={rowStyles.media.class} title={`span:${row.span} pause:${row.pause}`}>
          {row.media}
        </div>

        <div className={rowStyles.pause.class}>{row.pause}</div>

        <div className={rowStyles.url.class} title={row.url}>
          {elUrl || '-'}
        </div>

        <div className={rowStyles.logical.class} title={row.logicalPath}>
          {row.mediaLabel}
        </div>
      </div>
    );
  });

  const elHeader = (
    <div className={styles.header.class}>
      <div></div>
      <div>vTime</div>
      <div>Media</div>
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
