import React from 'react';
import { type t, Color, css, Monaco } from './common.ts';

export const Sample: React.FC<t.SampleEduProps> = (props) => {
  const { debug = false, repo, path } = props;

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

  console.log('path', path);

  return (
    <div className={css(styles.base, props.style).class}>
      <Monaco.Yaml.Editor theme={theme.name} repo={repo} path={path} />
    </div>
  );
};
