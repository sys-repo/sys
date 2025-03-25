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

    // const container = sheet.container('min-width: 600px');
    // const scope = container.scope(`.${styles.h2.class}`);

    // const scope = styles.h2.container('min-width: 600px');
    // scope.rules.add('', { fontSize: 100 });
  }, []);

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const condition = 'min-width: 600px';

  const styles = {
    base: css({
      padding: 30,
      color: theme.fg,
      letterSpacing: -0.5,
      containerType: 'size', //           🌼 ← NB: turn this on for the @container rules to take effect (width AND height).
      // containerType: 'inline-size', // 🌼 ← NB: turn this on for the @container rules to take effect (width only).
      overflow: 'hidden',
      display: 'grid',
      placeItems: 'center',
    }),

    h1: css({
      color: 'red',
      fontSize: 50,
      transition: 'font-size 200ms, color 200ms',
      whiteSpace: 'nowrap',
    })
      .container('min-width: 400px', { fontSize: 90, color: 'blue' })
      .container('min-width: 600px', { fontSize: 150, color: Color.DARK, letterSpacing: -4 }).done,

    h2: css({
      color: 'blue',
    }),
  };

  /**
   * Equivalent: (sample code)
   */
  // const container = styles.base.container('min-width: 600px');
  // container.rule('h2', {
  //   fontSize: 140,
  //   color: 'blue',
  //   letterSpacing: -3,
  //   transition: 'font-size 200ms',
  // });

  return (
    <div className={css(styles.base, props.style).class}>
      <h1 className={styles.h1.class}>{`Hello 👋`}</h1>
      <h2>{`H2 Heading`}</h2>
    </div>
  );
};
