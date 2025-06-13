import React from 'react';

import { type t, Color, css, TextInput } from './common.ts';
import { ActionButton } from './ui.ActionButton.tsx';

export const DocumentIdInput: React.FC<t.DocumentIdInputProps> = (props) => {
  const { label = 'document-id:', docId } = props;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      color: theme.fg,
      fontSize: 14,
      display: 'grid',
      gridTemplateColumns: '1fr auto',
      alignItems: 'stretch',
      columnGap: 5,
    }),
    label: css({ Absolute: [-20, null, null, 5], opacity: 0.5 }),
    textbox: css({ fontSize: 14 }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={styles.label.class}>{label}</div>
      <TextInput
        value={docId}
        border={{ mode: 'underline', defaultColor: 0 }}
        background={theme.is.dark ? -0.08 : 0}
        theme={theme.name}
        style={styles.textbox}
        onChange={props.onTextChange}
      />
      <ActionButton />
    </div>
  );
};
