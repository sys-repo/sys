import React from 'react';

import { type t, Color, css, TextInput } from './common.ts';
import { ActionButton } from './ui.ActionButton.tsx';
import { useController } from './use.Controller.ts';

export const View: React.FC<t.DocumentIdInputProps> = (props) => {
  const { label, value: docId, placeholder = 'document-id' } = props;

  /**
   * Hooks:
   */
  const controller = useController(props.state);

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      position: 'relative',
      color: theme.fg,
      fontSize: 14,
      display: 'grid',
      gridTemplateColumns: '1fr auto',
      alignItems: 'stretch',
      columnGap: 5,
    }),
    textbox: css({ fontSize: 14 }),
    label: css({
      Absolute: [-20, null, null, 5],
      opacity: 0.5,
      fontSize: 11,
      userSelect: 'none',
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={styles.label.class}>{label}</div>
      <TextInput
        value={docId}
        placeholder={placeholder}
        border={{ mode: 'underline', defaultColor: 0 }}
        background={theme.is.dark ? -0.08 : 0}
        theme={theme.name}
        style={styles.textbox}
        onChange={(e) => {
          controller.handlers.onValueChange(e);
          props.onValueChange?.(e);
        }}
      />
      <ActionButton
        style={{ fontSize: 12 }}
        onClick={() => {
          const { action } = controller;
          const payload: t.DocumentIdInputActionArgs = { action };
          controller.handlers.onActionClick(payload);
          props.onActionClick?.(payload);
        }}
      />
    </div>
  );
};
