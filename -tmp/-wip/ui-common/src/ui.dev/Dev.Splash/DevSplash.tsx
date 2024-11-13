import { COLORS, css, DEFAULTS, FC, type t } from './common';
import { Footer, FooterInput } from './DevSplash.Footer';
import { useKeyboard } from './useKeyboard.mjs';

export type DevSplashProps = {
  children?: JSX.Element | never[];
  center?: boolean;
  footer?: FooterInput;
  fill?: boolean;
  keyboard?: boolean;
  style?: t.CssValue;
  onEnter?: () => void;
};

const View: React.FC<DevSplashProps> = (props) => {
  const {
    fill = DEFAULTS.fill,
    center = DEFAULTS.center,
    keyboard = DEFAULTS.keyboard,
    onEnter,
  } = props;

  useKeyboard({
    enabled: keyboard,
    onEnter,
  });

  /**
   * [Render]
   */
  const styles = {
    reset: css({ fontFamily: 'sans-serif' }),
    base: css({
      Absolute: fill ? 0 : undefined,
      position: !fill ? 'relative' : undefined,
      color: COLORS.DARK,
      cursor: 'default',
      display: 'grid',
      placeItems: center ? 'center' : undefined,
    }),
    link: css({
      color: COLORS.CYAN,
      textDecoration: 'none',
      ':hover': { textDecoration: 'underline' },
    }),
    defaultContent: css({
      fontSize: 70,
      fontWeight: 'bold',
      letterSpacing: -2,
    }),
    footer: css({ Absolute: [null, 0, 0, 0] }),
  };

  const elDefault = (
    <a href={'?dev'} {...styles.link}>
      <div {...styles.defaultContent}>{'?dev'}</div>
    </a>
  );
  const elContent = props.children || elDefault;
  const elFooter = props.footer && <Footer content={props.footer} style={styles.footer} />;

  return (
    <div {...css(styles.reset, styles.base, props.style)}>
      {elContent}
      {elFooter}
    </div>
  );
};

type Fields = { DEFAULTS: typeof DEFAULTS };
export const DevSplash = FC.decorate<DevSplashProps, Fields>(
  View,
  { DEFAULTS },
  { displayName: DEFAULTS.displayName },
);
