import type { t } from './common.ts';

/**
 * <Component>
 */
export type CmdBarProps = {
  cmd?: t.Cmd<t.CmdBarCtrlType>;
  issuer?: t.StringId;
  text?: string;
  placeholder?: string;
  hintKey?: string | string[];
  prefix?: JSX.Element | null | false;
  suffix?: JSX.Element | null | false;
  enabled?: boolean;
  focusOnReady?: boolean;
  useKeyboard?: boolean;
  focusBorder?: boolean | t.CmdBarFocusBorder;
  spinning?: boolean;
  readOnly?: boolean;

  theme?: t.CommonTheme;
  style?: t.CssValue;

  onReady?: t.CmdBarReadyHandler;
  onChange?: t.CmdBarChangeHandler;
  onSelect?: t.TextInputSelectHandler;
  onFocusChange?: t.TextInputFocusHandler;
  onKeyDown?: t.TextInputKeyHandler;
  onKeyUp?: t.TextInputKeyHandler;
};

export type CmdBarFocusBorder = {
  color?: { focused?: string | GetColor; unfocused?: string | GetColor };
  offset?: t.Pixels;
};
export type GetColor = (theme: t.ColorTheme) => string;

/**
 * Events
 */
export type CmdBarReadyHandler = (e: CmdBarReadyHandlerArgs) => void;
export type CmdBarReadyHandlerArgs = {
  readonly ctrl: t.CmdBarCtrl;
  readonly textbox: t.TextInputRef;
};

export type CmdBarChangeHandler = (e: CmdBarChangeHandlerArgs) => void;
export type CmdBarChangeHandlerArgs = t.TextInputChangeArgs & { readonly parsed: t.ParsedArgs };
