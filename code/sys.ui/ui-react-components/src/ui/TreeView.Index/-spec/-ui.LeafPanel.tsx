import React from 'react';
import { type t, Color, css, ObjectView } from './common.ts';

export type LeafPanelProps = {
  args: t.IndexTreeViewLeafRendererArgs;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const LeafPanel: React.FC<LeafPanelProps> = (props) => {
  const {} = props;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      position: 'relative',
      color: theme.fg,
      display: 'grid',
      padding: 8,
    }),
    body: css({
      backgroundColor: Color.ruby(0.1),
      border: `dashed 1px ${Color.alpha(theme.fg, 0.3)}`,
      borderRadius: 8,
      padding: 12,
      display: 'grid',
      minHeight: 0,
      alignContent: 'start',
      gridAutoFlow: 'row',
      gridAutoRows: 'min-content',
      rowGap: 10,
    }),
    obj: css({ marginLeft: 6 }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={styles.body.class}>
        <div>{`🌳 Leaf Panel`}</div>
        <ObjectView name={'t.LeafRendererArgs'} data={props.args} expand={1} style={styles.obj} />
      </div>
    </div>
  );
};
