import { useEffect, useState } from 'react';
import { Ctrl } from '../CmdBar.Ctrl/mod.ts';
import { Color, DEFAULTS, Immutable, KeyHint, Spinner, css, type t } from './common.ts';
import { Textbox } from './ui.Textbox.tsx';

const DEF = DEFAULTS.props;

export const View: React.FC<t.CmdBarProps> = (props) => {
  const { enabled = DEF.enabled, spinning = DEF.spinning, readOnly = DEF.readOnly } = props;
  const focusBorder = wrangle.focusBorder(props);

  const [ctrl, setCtrl] = useState<t.CmdBarCtrl>();
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (props.cmd) setCtrl(Ctrl.toCtrl(props.cmd));
  }, [props.cmd]);

  /**
   * Render
   */
  const theme = Color.theme(props.theme ?? 'Dark');
  const focusBorderColor = wrangle.focusBorderColor(props, theme, focused);
  const styles = {
    base: css({
      position: 'relative',
      backgroundColor: theme.bg,
      color: theme.fg,
      userSelect: 'none',
    }),
    grid: css({
      display: 'grid',
      gridTemplateColumns: wrangle.columns(props),
    }),
    focusBorder: css({
      Absolute: [focusBorder?.offset ?? 0, 0, null, 0],
      height: 1.5,
      pointerEvents: 'none',
      backgroundColor: focusBorderColor,
      transition: `background-color 50ms`,
    }),
    textbox: css({ boxSizing: 'border-box', Padding: [7, 7], display: 'grid' }),
    hintKey: css({ marginRight: 7 }),
    spinner: css({ width: 50, display: 'grid', placeItems: 'center' }),
  };

  const elTextbox = (
    <div {...styles.textbox}>
      <Textbox
        {...props}
        ctrl={ctrl}
        enabled={enabled}
        theme={theme}
        readOnly={readOnly}
        opacity={enabled ? 1 : 0.3}
        onFocusChange={(e) => {
          setFocused(e.is.focused);
          props.onFocusChange?.(e);
        }}
      />
    </div>
  );

  const elHintKeys = (
    <KeyHint.Combo
      keys={props.hintKey}
      enabled={enabled}
      theme={theme.name}
      style={styles.hintKey}
    />
  );

  const elSpinner = spinning && (
    <div {...styles.spinner}>
      <Spinner.Bar theme={theme.name} width={24} color={focusBorderColor} />
    </div>
  );

  return (
    <div {...css(styles.base, styles.grid, props.style)}>
      {props.prefix}
      {elTextbox}
      {elSpinner ?? elHintKeys}
      {props.suffix}
      <div {...styles.focusBorder} />
    </div>
  );
};

/**
 * Helpers
 */
const wrangle = {
  columns(props: t.CmdBarProps) {
    let res = '1fr auto';
    if (props.prefix) res = `auto ${res}`;
    if (props.suffix) res = `${res} auto`;
    return res;
  },

  ctrl(props: t.CmdBarProps) {
    if (props.cmd) return props.cmd;
    const transport = Immutable.clonerRef({});
    const issuer = props.issuer;
    return Ctrl.toCmd(Ctrl.create({ transport, issuer }));
  },

  focusBorder(props: t.CmdBarProps): t.CmdBarFocusBorder {
    if (props.focusBorder === true) return DEFAULTS.focusBorder;
    if (typeof props.focusBorder === 'object') return props.focusBorder;
    return DEFAULTS.focusBorder;
  },

  focusBorderColor(props: t.CmdBarProps, theme: t.ColorTheme, isFocused: boolean) {
    if (props.focusBorder === false) return undefined;
    const config = wrangle.focusBorder(props);
    const focused = config?.color?.focused;
    const unfocused = config?.color?.unfocused;
    return wrangle.colorToString(theme, isFocused ? focused : unfocused);
  },

  colorToString(theme: t.ColorTheme, value?: string | t.GetColor) {
    return typeof value === 'function' ? value(theme) : value;
  },
} as const;
