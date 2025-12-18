import React from 'react';
import { type t, Color, css, Icons, Pkg, Str } from '../common.ts';

export type GridProps = {
  dist?: t.DistPkg;
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const Grid: React.FC<GridProps> = (props) => {
  const { debug = false, dist } = props;

  /**
   * Build row data.
   */
  const rows = React.useMemo(() => {
    const parts = dist?.hash?.parts ?? {};
    return Object.entries(parts).map(([path, value]) => {
      const info = Pkg.Dist.Part.parse(value);

      const hash = info?.hash;
      const bytes = info?.size;
      const hashHex = hash?.replace(/^sha256-/i, '');
      const hashLabel = hashHex ? `#${hashHex.slice(-5)}` : '-';

      return { path, bytes, hash, hashLabel };
    });
  }, [dist]);

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
      backgroundColor: Color.alpha(theme.bg, 0.7),
      backdropFilter: 'blur(8px)',
      borderBottom: `solid 1px ${Color.alpha(theme.fg, 0.12)}`,
      color: Color.alpha(theme.fg, 0.7),
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
    icon: css({
      width: 12,
      height: 12,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: Color.alpha(theme.fg, 0.55),
      marginLeft: 5,
    }),
    path: css({
      minWidth: 0,
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    }),
    size: css({ color: Color.alpha(theme.fg, 0.5) }),
    hash: css({ color: Color.alpha(theme.fg, 0.5) }),
    empty: css({ opacity: 0.5, padding: 8, display: 'grid', placeItems: 'center' }),
  } as const;

  const elHeader = (
    <div className={styles.header.class}>
      <div />
      <div>{'Path'}</div>
      <div>{'Size'}</div>
      <div>{'Hash'}</div>
    </div>
  );

  const elEmpty = rows.length === 0 && <div className={styles.empty.class}>{'(no files)'}</div>;

  const elRows = rows.map((row) => {
    const path = Str.ellipsize(row.path, 64);
    const size = row.bytes === undefined ? '-' : Str.bytes(row.bytes);

    return (
      <div key={row.path} className={styles.row.class}>
        <div className={styles.icon.class}>
          <Icons.Object size={12} />
        </div>

        <div className={styles.path.class} title={row.path}>
          {path}
        </div>

        <div className={styles.size.class}>{size}</div>

        <div className={styles.hash.class} title={row.hash ?? ''}>
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
