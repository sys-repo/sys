import { type t, Color, css, D, useKeyboard, KeyValue, Pkg } from './common.ts';

type P = t.Splash.Props;

export const Splash: t.FC<t.Splash.Props> = (props) => {
  const { debug = false } = props;
  const pkg = props.pkg ?? Pkg.unknown();
  const qs = wrangle.qs(props);
  const href = wrangle.href(props);

  /**
   * Hooks:
   */
  useKeyboard({ enabled: props.keyboardEnabled ?? D.keyboardEnabled });

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      color: theme.fg,
      fontFamily: 'sans-serif',
      display: 'grid',
      placeItems: 'center',
    }),
    link: css({
      color: 'inherit',
      textDecoration: 'none',
      display: 'block',
      cursor: 'pointer',
      outline: 'none',
      ':focus': { outline: 'none' },
      ':focus-visible': { outline: 'none' },
    }),
    body: css({
      display: 'grid',
      gridAutoFlow: 'row',
      gridAutoRows: 'min-content',
      rowGap: 9,
      marginBottom: 30,
      minWidth: 200,
    }),
    title: css({
      fontSize: 30,
      color: Color.BLUE,
    }),
    titleDev: css({
      textDecorationLine: 'underline',
      textDecorationStyle: 'dashed',
      textDecorationColor: Color.alpha(theme.fg, 0.2),
      textDecorationThickness: '1px',
      textUnderlineOffset: '5px',
      transition: 'text-decoration-color 100ms ease, text-decoration-style 100ms ease',
      ':hover': {
        textDecorationStyle: 'solid',
        textDecorationColor: 'currentColor',
      },
      ':focus-visible': {
        textDecorationStyle: 'solid',
        textDecorationColor: 'currentColor',
      },
    }),
    qs: css({
      color: Color.alpha(theme.fg, 0.2),
      marginRight: 2,
      textDecoration: 'none',
    }),
    info: css({ position: 'relative', marginLeft: 19 }),
    traceline: {
      y: css({
        width: 1,
        Absolute: [-55, null, -80, 0],
        backgroundColor: Color.alpha(theme.fg, 0.03),
      }),
      x: css({
        height: 1,
        Absolute: [-11.5, -30, null, -30],
        backgroundColor: Color.alpha(theme.fg, 0.03),
      }),
    },
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <a href={href} className={styles.link.class}>
        <div className={styles.body.class}>
          <div className={styles.title.class}>
            <span className={styles.qs.class}>{'?'}</span>
            <span className={styles.titleDev.class}>{qs}</span>
          </div>
          <div className={styles.info.class}>
            <div className={styles.traceline.y.class} />
            <div className={styles.traceline.x.class} />
            <KeyValue.UI
              theme={theme.name}
              items={[
                { k: 'pkg', v: pkg.name },
                { k: 'version', v: pkg.version },
              ]}
            />
          </div>
        </div>
      </a>
    </div>
  );
};

/**
 * Helpers:
 */
const wrangle = {
  qs(props: P) {
    const { qs = D.qs } = props;
    return qs.trim().replace(/^\?+/, '');
  },

  href(props: P) {
    const qs = wrangle.qs(props);
    return qs ? `?${qs}` : '';
  },
} as const;
