import { Color, COLORS, css, Icons, type t } from './-common';
import { DevModifierKeys } from './DEV.ModifierKeys';

export type DevSampleProps = {
  state: t.KeyboardState;
  style?: t.CssValue;
};

export const DevSample: React.FC<DevSampleProps> = (props) => {
  const { state } = props;

  /**
   * [Render]
   */
  const styles = {
    base: css({
      position: 'relative',
      display: 'grid',
      gridTemplateRows: '1fr auto',
    }),
    body: {
      base: css({ position: 'relative' }),
      inner: css({
        Absolute: 0,
        overflow: 'hidden',
        display: 'grid',
        placeItems: 'center',
      }),
    },
    footer: css({
      padding: 10,
      boxSizing: 'border-box',
      display: 'grid',
      gridTemplateColumns: 'auto 1fr auto',
    }),
    icon: css({ Absolute: [0, null, null, 12] }),
    keys: css({ Flex: 'x-center-center' }),
    key: {
      base: css({
        Flex: 'y-center-center',
        position: 'relative',
        color: COLORS.DARK,
        backgroundColor: Color.alpha(COLORS.DARK, 0.04),
        PaddingX: 10,
        padding: 3,
        boxSizing: 'border-box',
      }),
      label: css({ fontSize: 50 }),
      code: css({ fontSize: 9, paddingTop: 5 }),
      traceline: css({
        height: 1,
        Absolute: [49, 0, null, 0],
        backgroundColor: Color.alpha(COLORS.MAGENTA, 0.2),
        userSelect: 'none',
      }),
    },
  };

  const elIcon = (
    <Icons.Keyboard.fill size={42} color={Color.alpha(COLORS.DARK, 0.3)} style={styles.icon} />
  );

  const elKeys = (
    <div {...styles.keys}>
      {state.current.pressed.map((e, i) => {
        return (
          <div key={`${e.code}.${i}`} {...styles.key.base}>
            <div {...styles.key.label}>{e.key}</div>
            <div {...styles.key.code}>{e.code}</div>
            <div {...styles.key.traceline} />
          </div>
        );
      })}
    </div>
  );

  return (
    <div {...css(styles.base, props.style)}>
      <div {...styles.body.base}>
        <div {...styles.body.inner}>
          {elKeys}
          {elIcon}
        </div>
      </div>
      <div {...styles.footer}>
        <DevModifierKeys edge={'Left'} state={state} />
        <div />
        <DevModifierKeys edge={'Right'} state={state} />
      </div>
    </div>
  );
};
