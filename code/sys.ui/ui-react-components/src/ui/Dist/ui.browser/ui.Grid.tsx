import React from 'react';
import { type t, Color, css, Filter, Icons, Pkg, Str } from '../common.ts';

export type GridProps = {
  dist?: t.DistPkg;
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
  selectedPath?: t.StringPath;
  filterText?: string;
  onSelect?: t.DistBrowserSelectHandler;
};

type Row = {
  readonly path: string;
  readonly bytes?: number;
  readonly hash?: string;
  readonly hashLabel: string;
};

/**
 * Component:
 */
export const Grid: React.FC<GridProps> = (props) => {
  const { debug = false, dist, filterText } = props;

  /**
   * Build row data.
   */
  const rows = React.useMemo(() => {
    return buildRows({ dist, filterText });
  }, [dist, filterText]);

  /**
   * Render:
   */
  const COLS = '16px 1fr auto 45px';
  const theme = Color.theme(props.theme);
  const columnGap = 12;
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
      columnGap,
      padding: '4px 0',
      position: 'sticky',
      top: 0,
      zIndex: 2,
      color: Color.alpha(theme.fg, 0.3),
      backgroundColor: Color.alpha(theme.bg, 0.7),
      backdropFilter: 'blur(8px)',
      borderBottom: `solid 1px ${Color.alpha(theme.fg, 0.12)}`,
      letterSpacing: 0.06,
      fontSize: 10,
    }),
    row: css({
      display: 'grid',
      gridTemplateColumns: COLS,
      columnGap,
      padding: '3px 0',
      alignItems: 'center',
      minWidth: 0,
    }),

    rowSelected: css({
      backgroundColor: Color.alpha(Color.BLUE, 0.18),
      boxShadow: `inset 2px 0 0 ${Color.alpha(Color.BLUE, 0.7)}`,
    }),

    icon: css({
      width: 12,
      height: 12,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: 5,
      opacity: 0.2,
    }),

    iconHeader: css({ opacity: 1 }),
    iconSelected: css({ opacity: 0.9 }),

    path: css({
      minWidth: 0,
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    }),

    size: css({ color: Color.alpha(theme.fg, 0.3) }),
    hash: css({ color: Color.alpha(theme.fg, 0.3) }),
    sizeSelected: css({ color: Color.alpha(theme.fg, 0.9) }),
    hashSelected: css({ color: Color.alpha(theme.fg, 0.9) }),

    empty: css({ opacity: 0.5, padding: 8, display: 'grid', placeItems: 'center' }),
  } as const;

  const elHeader = (
    <div className={styles.header.class}>
      <div>
        <div className={css(styles.icon, styles.iconHeader).class}>
          <Icons.Object size={12} style={{ color: Color.WHITE }} />
        </div>
      </div>
      <div>{'Path'}</div>
      <div>{'Size'}</div>
      <div>{'Hash'}</div>
    </div>
  );

  const elEmpty = rows.length === 0 && <div className={styles.empty.class}>{'(no files)'}</div>;

  const elRows = rows.map((row) => {
    const path = Str.ellipsize(row.path, 64);
    const size = row.bytes === undefined ? '-' : Str.bytes(row.bytes);

    const isSelected = row.path === props.selectedPath;
    const elRowClass = css(styles.row, isSelected ? styles.rowSelected : undefined).class;
    const elIconClass = css(styles.icon, isSelected ? styles.iconSelected : undefined).class;
    const elSizeClass = css(styles.size, isSelected ? styles.sizeSelected : undefined).class;
    const elHashClass = css(styles.hash, isSelected ? styles.hashSelected : undefined).class;

    return (
      <div
        key={row.path}
        className={elRowClass}
        data-selected={isSelected ? 'true' : undefined}
        onPointerDown={() => props.onSelect?.({ path: row.path })}
      >
        <div className={elIconClass}>
          <Icons.File size={10} />
        </div>

        <div className={styles.path.class} title={row.path}>
          {path}
        </div>

        <div className={elSizeClass}>{size}</div>

        <div className={elHashClass} title={row.hash ?? ''}>
          {row.hashLabel}
        </div>
      </div>
    );
  });

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={styles.body.class}>
        {!elEmpty && elHeader}
        {elEmpty || elRows}
      </div>
    </div>
  );
};

/** ------------------------------------------------------------
 * Helpers
 */

/**
 * Heuristic to choose filtering mode for file-path queries.
 * - fuzzy for mnemonic typing (fb → foo/bar)
 * - contains for literal intent (.ts, /path, foo-bar)
 */
const chooseFilterMode = (input: string): t.TextFilter.Options['mode'] => {
  const q = input.trim();
  if (!q) return 'contains';
  if (/[\/._\-@:]/.test(q)) return 'contains';
  return 'fuzzy';
};

const buildRows = (args: {
  readonly dist?: t.DistPkg;
  readonly filterText?: string;
}): readonly Row[] => {
  const { dist, filterText } = args;

  const parts = dist?.hash?.parts ?? {};
  const all: Row[] = Object.entries(parts).map(([path, value]) => {
    const info = Pkg.Dist.Part.parse(value);

    const hash = info?.hash;
    const bytes = info?.size;
    const hashHex = hash?.replace(/^sha256-/i, '');
    const hashLabel = hashHex ? `#${hashHex.slice(-5)}` : '-';

    return { path, bytes, hash, hashLabel };
  });

  const query = filterText ?? '';
  if (!query.trim()) return all;

  const mode = chooseFilterMode(query);
  const candidates: readonly t.TextFilter.Candidate<Row>[] = all.map((row) => ({
    text: row.path,
    value: row,
  }));
  const matches = Filter.apply(query, candidates, { mode, limit: 200 });
  return matches.map((m) => m.value);
};
