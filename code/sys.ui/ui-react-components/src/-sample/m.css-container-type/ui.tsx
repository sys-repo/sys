import React from 'react';
import { type t, Color, css, Style } from './common.ts';
import { MdNoCell } from 'npm:react-icons@5.5.0/md';

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
    // return;
    const sheet = Style.Dom.stylesheet();

    // sheet.rule('.card h2', { fontSize: 50 });
    // sheet.rule('.card h2', { fontSize: 100 }, { context: '@container (min-width: 600px)' });

    // const container = sheet.container('min-width: 600px');
    // container.rules.add('.card h2', { fontSize: 150 });

    // sheet.rule(`.${styles.base.class} h2`, { fontSize: 50 });
    // const container = sheet.container('min-width: 600px');
    // container.rules.add(`.${styles.base.class} h2`, { fontSize: 150 });

    const container = sheet.container('min-width: 600px');
    const scope = container.scope(`.${styles.h2.class}`);
    scope.rules.add('', { fontSize: 150 });
  }, []);

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      color: theme.fg,
      padding: 30,
      containerType: 'inline-size', // 🌼 ← NOTE: turn this on for the @container rules to take effect.
    }),
    h2: css({ fontSize: 50, color: 'red' }),
    text: css({ fontSize: 30 }),
  };

  console.log('styles.text.class', styles.text.class);

  const className = css(styles.base, props.style).class;
  return (
    <div className={`${className} card`}>
      <h2 className={styles.h2.class}>{`Hello 👋`}</h2>
      <div className={styles.text.class}>My Text Hello</div>
    </div>
  );
};
