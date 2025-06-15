import React, { useRef, useState } from 'react';

import { type t, Color, css, D, TextInput, Time, useDebouncedValue, usePointer } from './common.ts';
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
   * Refs:
   */
  const timeoutRef = useRef<() => void>();
  const inputRef = useRef<HTMLInputElement>();
  const focus = () => inputRef.current?.focus();

  /**
   * Hooks:
   */
  const [copied, setCopied] = useState(false);
  const [overTextbox, setOverTextbox] = useState(false);
  const pointer = usePointer((e) => setOverTextbox(e.is.over));

  /**
   * Hook: Controller/State.
   */
  const controller = useController(props.controller);

  const docId = controller.props.id;
  const repo = controller.props.repo;
  const is = controller.props.is;
  const showAction = useDebouncedValue(controller.ready && is.enabled.action, 50);
  const active = enabled && !!repo;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      position: 'relative',
      height: 29,
      fontSize: 14,
      color: theme.fg,
      backgroundColor: theme.format(props.background).bg,
      lineHeight: 'normal',
      display: 'grid',
      gridTemplateColumns: showAction ? '1fr auto' : '1fr',
      alignItems: 'stretch',
    }),
    textbox: css({ fontSize: 14 }),
    label: css({ Absolute: [-20, null, null, 5], opacity: 0.5, fontSize: 11, userSelect: 'none' }),
    actionButton: css({
      fontSize: 12,
      marginLeft: 5,
      ...props.buttonStyle,
    }),
    copied: css({
      Absolute: [0, null, 0, 30],
      pointerEvents: 'none',
      paddingBottom: 3,
      opacity: 0.3,
      display: 'grid',
      placeItems: 'center',
    }),
  };

  const elPrefix = (
    <Prefix
      docId={docId}
      over={active && overTextbox}
      enabled={active}
      copied={copied}
      theme={theme.name}
      onPointer={(e) => e.is.down && focus()}
      onCopied={() => {
        timeoutRef.current?.();
        setCopied(true);
        timeoutRef.current = Time.delay(1_500, () => setCopied(false)).cancel;
      }}
    />
  );
  const elSuffix = (
    <Suffix
      docId={docId}
      spinning={is.spinning}
      over={active && overTextbox}
      enabled={active}
      theme={theme.name}
      onPointer={(e) => e.is.down && focus()}
      onClearClick={() => controller.handlers.onAction({ action: 'Clear' })}
    />
  );

  const elCopied = copied && <div className={styles.copied.class}>{'copied'}</div>;

  const elActionButton = showAction && (
    <ActionButton
      style={styles.actionButton}
      action={controller.props.action}
      enabled={active && is.enabled.action}
      onClick={() => {
        const { action } = controller.props;
        const payload: t.DocumentIdInputActionArgs = { action };
        controller.handlers.onAction(payload);
      }}
    />
  );

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={styles.label.class}>{label}</div>
      <div {...pointer.handlers}>
        <TextInput
          value={docId}
          prefix={elPrefix}
          suffix={elSuffix}
          placeholder={placeholder}
          disabled={!(active && is.enabled.input)}
          //
          theme={theme.name}
          style={styles.textbox}
          inputStyle={{
            opacity: copied ? 0.1 : 1,
            blur: copied ? 8 : 0,
          }}
          border={{ mode: 'underline', defaultColor: 0 }}
          background={0}
          autoFocus={autoFocus}
          //
          onReady={(e) => (inputRef.current = e.input)}
          onChange={(e) => controller.handlers.onTextChange(e)}
          onKeyDown={(e) => controller.handlers.onKeyDown(e)}
        />
      </div>
      {elActionButton}
      {elCopied}
    </div>
  );
};
