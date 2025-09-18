import React from 'react';
import { type t, Color, css, Monaco } from './common.ts';

export const Sample: React.FC<t.SampleProps> = (props) => {
  const { debug = false, repo, path, localstorage } = props;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      backgroundColor: Color.ruby(debug),
      color: theme.fg,
      display: 'grid',
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <Monaco.Yaml.Editor
        theme={theme.name}
        repo={repo}
        path={path}
        signals={props.signals}
        documentId={{ localstorage }}
      />
    </div>
  );
};
