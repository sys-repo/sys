import React from 'react';
import { type t, Color, css, Icons, PathView } from './common.ts';

type P = t.SampleProps & { yaml: t.EditorYaml };

/**
 * Component:
 */
export const Footer: React.FC<P> = (props) => {
  const { debug = false, yaml } = props;

  const errors = yaml.parsed.errors;
  const hasErrors = errors.length > 0;
  const tooltip = errors.map((err) => err.message).join('\n');

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      backgroundColor: Color.alpha(Color.BLACK, theme.is.dark ? 0.18 : 0.02),
      padding: 8,
      paddingLeft: 12,

      display: 'grid',
      gridTemplateColumns: '1fr auto',
      alignItems: 'center',
    }),
    error: css({
      opacity: hasErrors ? 1 : 0,
      transition: 'opacity 120ms ease',
    }),
  };

  const elError = (
    <Icons.Error
      //
      size={18}
      color={Color.YELLOW}
      style={styles.error}
      tooltip={tooltip}
    />
  );

  return (
    <div className={css(styles.base, props.style).class}>
      <PathView
        prefix={'path:'}
        prefixColor={theme.is.dark ? Color.CYAN : Color.BLUE}
        path={yaml.cursor.path}
        theme={theme.name}
      />
      {elError}
    </div>
  );
};
