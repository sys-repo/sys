import { type t, Color, css } from '../../u.ts';

type P = t.LayoutCenterColumnProps;

type Props = Pick<P, 'theme' | 'align'> & {
  onAlignChange?: (e: { align: P['align'] }) => void;
};

export function renderColumns(props: Props) {
  const theme = Color.theme(props.theme);
  const styles = {
    center: css({ overflow: 'hidden' }),
    edge: css({
      backgroundColor: Color.alpha(theme.fg, theme.is.dark ? 0.06 : 0.04),
      display: 'grid',
      placeItems: 'center',
      userSelect: 'none',
    }),
  };

  const alignHandler = (align: t.CenterColumnAlign) => () => props.onAlignChange?.({ align });
  const edgeDiv = (edge: t.CenterColumnAlign) => {
    return (
      <div className={styles.edge.class} onMouseDown={alignHandler(edge)}>
        {edge}
      </div>
    );
  };

  const left = edgeDiv('Left');
  const right = edgeDiv('Right');
  const center = (
    <div className={styles.center.class} onMouseDown={alignHandler('Center')}>
      <div style={{ padding: 10 }}>{'👋 Hello Center (Column)'}</div>
    </div>
  );

  return {
    left,
    center,
    right,
  } as const;
}
