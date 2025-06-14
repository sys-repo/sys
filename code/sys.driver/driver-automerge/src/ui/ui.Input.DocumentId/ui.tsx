import React from 'react';

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
   * Hooks:
   */
  const [copied, setCopied] = React.useState(false);
  const [overTextbox, setOverTextbox] = React.useState(false);
  const pointer = usePointer({
    onEnter: () => setOverTextbox(true),
    onLeave: () => setOverTextbox(false),
  });

  /**
   * Hook: Controller/State.
   */
  const controller = useController(props.controller);
  const docId = controller.props.id;
  const doc = controller.props.doc;
  const is = controller.props.is;
  const showAction = useDebouncedValue(controller.ready && is.enabled.action, 50);

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
      gridTemplateColumns: showAction ? '1fr auto' : '1fr',
      alignItems: 'stretch',
      height: 29,
    }),
    textbox: css({ fontSize: 14 }),
    label: css({ Absolute: [-20, null, null, 5], opacity: 0.5, fontSize: 11, userSelect: 'none' }),
    actionButton: css({
      fontSize: 12,
      marginLeft: props.columnGap ?? 5,
      ...props.buttonStyle,
    }),
    copied: css({
      Absolute: [0, null, 0, 30],
      pointerEvents: 'none',
      display: 'grid',
      placeItems: 'center',
      opacity: 0.3,
    }),
  };

  const elPrefix = (
    <Prefix
      doc={doc}
      over={overTextbox}
      copied={copied}
      theme={theme.name}
      onCopied={() => {
        setCopied(true);
        Time.delay(1_500, () => setCopied(false));
      }}
    />
  );
  const elSuffix = (
    <Suffix
      doc={doc}
      spinning={is.spinning}
      over={overTextbox}
      theme={theme.name}
      onClearClick={() => controller.handlers.onAction({ action: 'Clear' })}
    />
  );

  const elCopied = copied && <div className={styles.copied.class}>{'copied'}</div>;

  const elActionButton = showAction && (
    <ActionButton
      style={styles.actionButton}
      action={controller.props.action}
      enabled={enabled && is.enabled.action}
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
          disabled={!(enabled && is.enabled.input)}
          value={docId}
          placeholder={placeholder}
          prefix={elPrefix}
          suffix={elSuffix}
          border={{ mode: 'underline', defaultColor: 0 }}
          background={props.textboxBackground}
          autoFocus={autoFocus}
          theme={theme.name}
          style={styles.textbox}
          inputStyle={{ opacity: copied ? 0 : 1 }}
          onChange={(e) => controller.handlers.onTextChange(e)}
          onKeyDown={(e) => controller.handlers.onKeyDown(e)}
          onFocus={(e) => Time.delay(0, () => e.input.select())}
        />
      </div>
      {elActionButton}
      {elCopied}
    </div>
  );
};
