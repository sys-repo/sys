import React from 'react';

import { type t, Color, css, D, TextInput, usePointer } from './common.ts';
import { ActionButton } from './ui.ActionButton.tsx';
import { Prefix } from './ui.Prefix.tsx';
import { Suffix } from './ui.Suffix.tsx';
import { useController } from './use.Controller.ts';

type P = t.DocumentIdInputProps;

export const View: React.FC<P> = (props) => {
  const {
    label,
    placeholder = D.placeholder,
    autoFocus = D.autoFocus,
    enabled = D.enabled,
  } = props;

  /**
   * Hooks:
   */
  const [isOver, setOver] = React.useState(false);
  const pointer = usePointer({ onEnter: () => setOver(true), onLeave: () => setOver(false) });

  /**
   * Hook: Controller/State.
   */
  const controller = useController(props.controller);
  const docId = controller.props.id;
  const doc = controller.props.doc;
  const repo = controller.props.repo;
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
      lineHeight: 'normal',
      display: 'grid',
      gridTemplateColumns: '1fr auto',
      alignItems: 'stretch',
      columnGap: props.columnGap ?? 5,
    }),
    textbox: css({ fontSize: 14 }),
    label: css({ Absolute: [-20, null, null, 5], opacity: 0.5, fontSize: 11, userSelect: 'none' }),
    btn: css({
      fontSize: 12,
      ...props.buttonStyle,
    }),
  };

  const elPrefix = <Prefix theme={theme.name} doc={doc} repo={repo} isOverParent={isOver} />;
  const elSuffix = <Suffix spinning={is.spinning} theme={theme.name} />;

  return (
    <div className={css(styles.base, props.style).class} {...pointer.handlers}>
      <div className={styles.label.class}>{label}</div>
      <TextInput
        disabled={!(enabled && is.enabled.input)}
        value={docId}
        placeholder={placeholder}
        prefix={elPrefix}
        suffix={elSuffix}
        border={{ mode: 'underline', defaultColor: 0 }}
        background={wrangle.textboxBackground(props)}
        autoFocus={autoFocus}
        theme={theme.name}
        style={styles.textbox}
        onChange={(e) => controller.handlers.onTextChange(e)}
        onKeyDown={(e) => controller.handlers.onKeyDown(e)}
      />
      <ActionButton
        style={styles.btn}
        action={controller.props.action}
        enabled={enabled && is.enabled.action}
        onClick={() => {
          const { action } = controller.props;
          const payload: t.DocumentIdInputActionArgs = { action };
          controller.handlers.onActionClick(payload);
        }}
      />
    </div>
  );
};

/**
 * Helpers:
 */
const wrangle = {
  textboxBackground(props: P) {
    const theme = Color.theme(props.theme);
    const prop = props.textboxBackground;
    if (prop == null) return theme.is.dark ? -0.08 : -0.04;
    return 0;
  },
} as const;
