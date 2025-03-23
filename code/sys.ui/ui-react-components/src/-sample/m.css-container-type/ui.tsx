import React from 'react';
import { type t, Color, css, Style } from './common.ts';

/**
 * 🌼 NOTE: import the raw stylesheet
 *
 * @container → MDN Docs:
 *    https://developer.mozilla.org/en-US/docs/Web/CSS/@container
 *    Compatibility:
 *        Baseline compatible → "broadly supported across the major browsers as of <2023>"
 *        https://developer.mozilla.org/en-US/docs/Glossary/Baseline/Compatibility
 *
 */
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

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      color: theme.fg,
      containerType: 'inline-size', // 🌼 ← NOTE: turn this on for the @container rules to take effect.
    }),
  };

  const className = css(styles.base, props.style).class;
  return (
    <div className={`${className} card`}>
      <h2> Hello </h2>
    </div>
  );
};
