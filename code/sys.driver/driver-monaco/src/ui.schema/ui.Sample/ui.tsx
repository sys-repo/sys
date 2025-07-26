import React from 'react';

import { type t, Color, css, D, Monaco } from './common.ts';
import { EditorsColumn } from './ui.col.Editor.tsx';
import { MainColumn } from './ui.col.Main.tsx';

type P = t.SampleProps;

export const Sample: React.FC<P> = (props) => {
  const { debug = false, signals } = props;

  /**
   * Hooks:
   */
  const yaml = Monaco.Yaml.useYaml({
    editor: signals.editor.value,
    doc: signals.doc.value,
    path: signals['yaml.path'].value,
  });

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      position: 'relative',
      color: theme.fg,
      display: 'grid',
      gridTemplateColumns: 'minmax(350px, 0.382fr) 0.618fr',
    }),
    left: css({
      borderRight: `solid 1px ${Color.alpha(theme.fg, D.borderOpacity)}`,
      display: 'grid',
    }),
    right: css({
      display: 'grid',
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={styles.left.class}>
        <EditorsColumn {...props} yaml={yaml} />
      </div>
      <div className={styles.right.class}>
        <MainColumn {...props} yaml={yaml} />
      </div>
    </div>
  );
};
