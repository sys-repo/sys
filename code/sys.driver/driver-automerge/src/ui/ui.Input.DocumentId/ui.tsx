import React, { useRef, useState } from 'react';

import {
  type t,
  Color,
  css,
  D,
  Is,
  rx,
  TextInput,
  useDebouncedValue,
  usePointer,
} from './common.ts';
import { ActionButton } from './ui.ActionButton.tsx';
import { Prefix } from './ui.Prefix.tsx';
import { Suffix } from './ui.Suffix.tsx';
import { useController } from './use.Controller.ts';
import { readonly } from 'zod/v4-mini';

type P = t.DocumentIdInputProps;

export const View: React.FC<P> = (props) => {
  const { label, autoFocus = D.autoFocus, enabled = D.enabled, readOnly = D.readOnly } = props;

  /**
   * Refs:
   */
  const inputRef = useRef<HTMLInputElement>();
  const focus = () => inputRef.current?.focus();

  /**
   * Hooks:
   */
  const [textboxOver, setOverTextbox] = useState(false);
  const [focused, setFocused] = React.useState(false);
  const pointer = usePointer((e) => setOverTextbox(e.is.over));

  /**
   * Hook: Controller/State.
   */
  const controller = useController(props.controller);

  const docId = controller.props.id;
  const doc = controller.props.doc;
  const repo = controller.props.repo;
  const is = controller.props.is;
  const showAction = useDebouncedValue(controller.ready && is.enabled.action && !readOnly, 50);
  const active = enabled && !!repo;
  const transient = controller.transient;
  const message = transient.message;

  /**
   * Effect: (mounted).
   */
  React.useEffect(() => {
    const life = rx.disposable();
    const signals = controller.signals;

    const fireChanged = () => props.onChange?.(payload());
    const payload = () => {
      const isHead = (doc && doc.id === docId) ?? false;
      return { isHead, signals, values: signals.toValues() };
    };

    // Bubble change events:
    const doc = signals.doc.value;
    const events = doc?.events(life);
    events?.$.subscribe(fireChanged);

    // Alert listeners:
    props.onReady?.(payload());
    fireChanged();

    return life.dispose;
  }, [repo?.id.instance, doc?.id, docId]);

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
      marginLeft: 3,
      ...props.buttonStyle,
    }),
    message: css({
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
      theme={theme.name}
      docId={docId}
      doc={doc}
      over={active && textboxOver}
      enabled={active}
      readOnly={readOnly}
      icon={transient.kind}
      onCopy={() => controller.handlers.onAction({ action: 'Copy' })}
      onPointer={(e) => {
        if (e.is.down) {
          e.cancel();
          focus();
        }
      }}
    />
  );
  const elSuffix = (
    <Suffix
      docId={docId}
      spinning={is.spinning}
      over={active && (textboxOver || is.spinning)}
      enabled={active}
      readOnly={readOnly}
      theme={theme.name}
      onPointer={(e) => {
        if (e.is.down) {
          e.cancel();
          focus();
        }
      }}
      onClearClick={() => controller.handlers.onAction({ action: 'Clear' })}
    />
  );

  const elMessage = transient.message && (
    <div className={styles.message.class}>{transient.message}</div>
  );

  const elActionButton = showAction && (
    <ActionButton
      style={styles.actionButton}
      action={controller.props.action}
      enabled={active && is.enabled.action}
      parentOver={textboxOver}
      parentFocused={focused}
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
          placeholder={wrangle.placeholder(props, controller, focused)}
          disabled={!(active && is.enabled.input)}
          readOnly={readOnly}
          //
          theme={theme.name}
          style={styles.textbox}
          inputStyle={{
            opacity: !!message ? 0.1 : 1,
            blur: !!message ? 8 : 0,
          }}
          border={{ mode: 'underline', defaultColor: 0 }}
          background={0}
          autoFocus={!readonly && autoFocus}
          //
          onReady={(e) => (inputRef.current = e.input)}
          onChange={(e) => controller.handlers.onTextChange(e)}
          onKeyDown={(e) => controller.handlers.onKeyDown(e)}
          onFocusChange={(e) => {
            if (readOnly) setFocused(false);
            else setFocused(e.focused);
          }}
        />
      </div>
      {elActionButton}
      {elMessage}
    </div>
  );
};

/**
 * Helpers:
 */
const wrangle = {
  placeholder(props: P, controller: t.DocumentIdHook, focused: boolean) {
    if (Is.string(props.placeholder)) return props.placeholder;
    if (focused && controller.history.length > 0) return `${D.placeholder}   •   ↑↓ for history`;
    return D.placeholder;
  },
} as const;
