import React from 'react';
import { type t, Color, css, Style } from './common.ts';
// import './styles.css';

export type ContainerProps = {
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

type P = ContainerProps;

/**
 * Component:
 */
export const Container: React.FC<P> = (props) => {
  const {} = props;

  /**
   * REF: https://chatgpt.com/share/67ddffa7-a668-800b-87f1-4aa855733c7b
   */
  React.useEffect(() => {
    const sheet = Style.Dom.stylesheet();
    sheet.rule('.card h2', { fontSize: 50 });
    // sheet.rule('.card h2', { fontSize: 100 }, { context: '@container (min-width: 600px)' });

    const container = sheet.context('@container', 'min-width: 600px');
    container.rule('.card h2', { fontSize: 200 });
  }, []);

  // css().context('@container', 'min-width: 600px', {});

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({ containerType: 'inline-size', color: theme.fg }),
  };

  return (
    <div className={`${css(styles.base, props.style).class} card`}>
      <h2> Hello </h2>
    </div>
  );
};
