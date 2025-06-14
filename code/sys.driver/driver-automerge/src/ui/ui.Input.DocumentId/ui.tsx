import React from 'react';

import { type t, Color, css, D, Spinners, TextInput } from './common.ts';
import { ActionButton } from './ui.ActionButton.tsx';
import { useController } from './use.Controller.ts';

export const View: React.FC<t.DocumentIdInputProps> = (props) => {
  const { label, placeholder = D.placeholder, autoFocus = D.autoFocus } = props;

  /**
   * Hooks:
   */
  const controller = useController(props.controller);
  const docId = controller.props.id;
  const is = controller.props.is;

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
    btn: css({ fontSize: 12 }),
    spinner: css({
      display: 'grid',
      placeItems: 'center',
      paddingRight: 10,
    }),
  };

  const elSpinner = is.spinning && (
    <div className={styles.spinner.class}>
      <Spinners.Bar theme={theme.name} width={20} />
    </div>
  );

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={styles.label.class}>{label}</div>
      <TextInput
        disabled={!is.enabled.input}
        value={docId}
        placeholder={placeholder}
        suffix={elSpinner}
        border={{ mode: 'underline', defaultColor: 0 }}
        background={theme.is.dark ? -0.08 : 0}
        autoFocus={autoFocus}
        theme={theme.name}
        style={styles.textbox}
        onChange={(e) => controller.handlers.onTextChange(e)}
        onKeyDown={(e) => controller.handlers.onKeyDown(e)}
      />
      <ActionButton
        style={styles.btn}
        action={controller.props.action}
        enabled={is.enabled.action}
        onClick={() => {
          const { action } = controller.props;
          const payload: t.DocumentIdInputActionArgs = { action };
          controller.handlers.onActionClick(payload);
        }}
      />
    </div>
  );
};
