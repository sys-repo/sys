import React from 'react';
import { type t, Color, css } from './common.ts';
import { Grid } from './ui.Grid.tsx';

/**
 * Component:
 */
export const Browser: React.FC<t.DistBrowserProps> = (props) => {
  const { debug = false, dist, selectedPath, onSelect } = props;

  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      backgroundColor: Color.ruby(debug),
      color: theme.fg,
      display: 'grid',
      gridTemplateRows: 'auto 1fr',
    }),
    header: css({
      backgroundColor: 'rgba(255, 0, 0, 0.1)' /* RED */,
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={styles.header.class}>{`Header`}</div>
      <Grid
        theme={theme.name}
        dist={dist}
        debug={debug}
        selectedPath={selectedPath}
        onSelect={onSelect}
      />
    </div>
  );
};
