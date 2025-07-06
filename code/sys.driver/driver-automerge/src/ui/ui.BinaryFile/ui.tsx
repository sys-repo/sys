import React from 'react';
import { type t, Color, css, D, ObjectView } from './common.ts';

export const BinaryFile: React.FC<t.BinaryFileProps> = (props) => {
  const { debug = false } = props;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      backgroundColor: Color.ruby(debug),
      color: theme.fg,
      padding: 10,
    }),
  };

  const data = {
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div>{`🐷 ${D.displayName}`}</div>
      <ObjectView name={'file-drop'} data={data} theme={theme.name} style={{ marginTop: 20 }} />
    </div>
  );
};
