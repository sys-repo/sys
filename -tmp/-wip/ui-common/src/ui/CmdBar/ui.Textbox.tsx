import { useEffect, useState } from 'react';
import { Ctrl } from '../CmdBar.Ctrl/mod.ts';
import { Args, css, DEFAULTS, rx, TextInput, type t } from './common.ts';

export type TextboxProps = Omit<t.CmdBarProps, 'theme' | 'cmd'> & {
  ctrl?: t.CmdBarCtrl;
  theme: t.ColorTheme;
  opacity?: number;
};

const DEF = DEFAULTS.props;

export const Textbox: React.FC<TextboxProps> = (props) => {
  const {
    ctrl,
    theme,
    text = '',
    enabled = DEF.enabled,
    focusOnReady = DEF.focusOnReady,
    placeholder = DEF.placeholder,
    readOnly = DEF.readOnly,
    useKeyboard,
  } = props;

  const [ready, setReady] = useState(false);
  const [textbox, setTextbox] = useState<t.TextInputRef>();

  /**
   * Handlers
   */
  const handleChange: t.TextInputChangeHandler = (e) => {
    let _parsed: t.ParsedArgs;
    props.onChange?.({
      ...e,
      get parsed() {
        const argv = (e.to ?? '').split(' ');
        return _parsed || (_parsed = Args.parse(argv));
      },
    });
  };

  const handleKeydown: t.TextInputKeyHandler = (e) => {
    props.onKeyDown?.(e);
    if (e.key === 'Enter') ctrl?.invoke({ text });
  };

  /**
   * Listeners
   */
  useEffect(() => {
    const { dispose, dispose$ } = rx.disposable();
    if (ctrl && textbox) Ctrl.listen({ ctrl, textbox, useKeyboard, dispose$ });
    return dispose;
  }, [ctrl, textbox, useKeyboard]);

  useEffect(() => {
    if (ready || !textbox || !ctrl) return;
    setReady(true);
    props.onReady?.({ ctrl, textbox });
  }, [textbox, ctrl, ready]);

  /**
   * Render
   */
  const color = theme.fg;
  const styles = { base: css({ opacity: props.opacity ?? 1 }) };

  return (
    <TextInput
      style={styles.base}
      value={text}
      theme={theme.name}
      placeholder={placeholder}
      placeholderStyle={{
        opacity: 0.4,
        color,
        fontFamily: 'sans-serif',
        disabledColor: theme.alpha(0.5).fg,
      }}
      valueStyle={{
        color,
        fontFamily: 'monospace',
        fontWeight: 'normal',
        fontSize: 16,
        disabledColor: color,
      }}
      isEnabled={enabled}
      isReadOnly={readOnly}
      spellCheck={false}
      autoCorrect={false}
      autoCapitalize={false}
      focusOnReady={focusOnReady}
      selectOnReady={focusOnReady}
      onFocusChange={props.onFocusChange}
      onChange={handleChange}
      onKeyDown={handleKeydown}
      onKeyUp={props.onKeyUp}
      onSelect={props.onSelect}
      onReady={(e) => setTextbox(e.ref)}
    />
  );
};
