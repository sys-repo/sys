import React from 'react';
import { type t, Color, css } from './common.ts';
import { UI as TextInput } from '../../Text.Input/mod.ts';

export type ToolbarProps = {
  placement?: t.DistBrowserToolbarPlacement;
  placeholderText?: string;
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;

  /**
   * Filter textbox value.
   * - If provided → controlled
   * - Otherwise → toolbar/controller may manage it
   */
  filterText?: string;
  onFilter?: t.DistBrowserFilterHandler;
};

/**
 * Component:
 */
export const Toolbar: React.FC<ToolbarProps> = (props) => {
  const {
    //
    debug = false,
    filterText,
    placement = 'top',
    placeholderText = 'filter on path',
  } = props;

  const onChange: t.TextInput.ChangeHandler = (e) => {
    props.onFilter?.({ text: e.value });
  };

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      backgroundColor: Color.ruby(debug),
      color: theme.fg,
      display: 'grid',
      border: 'none',
    }),
    input: css({
      width: '100%',
      fontSize: 14,
    }),
  } as const;

  return (
    <div className={css(styles.base, props.style).class}>
      <TextInput
        theme={theme.name}
        value={filterText} // ← allow uncontrolled when <undefined>
        placeholder={placeholderText}
        spellCheck={false}
        autoCapitalize={false}
        autoCorrect={false}
        autoComplete={false}
        border={{
          mode: placement === 'top' ? 'line:bottom' : 'line:top',
          defaultColor: Color.alpha(theme.fg, 0.2),
          focusColor: Color.BLUE,
        }}
        padding={[6, 10]}
        style={styles.input}
        onChange={onChange}
      />
    </div>
  );
};
