import { useEffect, useState } from 'react';
import { COLORS, Color, ObjectPath, TextInput, css, rx, type t } from './common.ts';
import { TextboxSync } from './Sync.ts';

/**
 * <Textbox>
 */
export type TextboxProps = {
  state?: t.TextboxSyncState;
  path?: t.ObjectPath;
  focus?: boolean;
  debug?: string;
  theme?: t.CommonTheme;
  style?: t.CssValue;
};
export const Textbox: React.FC<TextboxProps> = (props) => {
  const { focus, state, theme, debug, path = [] } = props;
  const enabled = !!state;

  const [text, setText] = useState('');
  const [textbox, setTextbox] = useState<t.TextInputRef>();

  /**
   * Lifecycle
   */
  useEffect(() => {
    const life = rx.disposable();
    if (state && textbox) {
      const initial = ObjectPath.resolve<string>(state.current, path);
      setText(initial ?? '');

      const { dispose$ } = life;
      const listener = TextboxSync.listen(textbox, state, path, { debug, dispose$ });
      listener.onChange((e) => setText(e.text));
    }
    return life.dispose;
  }, [state?.instance, !!textbox, path?.join('.')]);

  useEffect(() => {
    if (focus && textbox && state) textbox.focus();
  }, [focus, !!textbox, !!state]);

  /**
   * Render
   */
  const color = Color.theme(theme).fg;
  const styles = {
    base: css({
      position: 'relative',
      color,
      Padding: [5, 7],
      borderBottom: `dashed 1px ${Color.alpha(COLORS.CYAN, enabled ? 0.9 : 0.2)}`,
    }),
    debug: css({
      Absolute: [3, null, 0, -30],
      display: 'grid',
      placeItems: 'center',
      fontSize: 22,
    }),
  };

  return (
    <div {...css(styles.base, props.style)}>
      <div {...styles.debug}>{debug}</div>
      <TextInput
        value={text}
        theme={theme}
        isEnabled={enabled}
        placeholder={'text'}
        spellCheck={false}
        onReady={(e) => setTextbox(e.ref)}
        onChange={(e) => setText(e.to)}
      />
    </div>
  );
};
