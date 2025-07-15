import React, { useRef, useState } from 'react';

import {
  type t,
  Color,
  css,
  D,
  Is,
  Kbd,
  rx,
  TextInput,
  useDebouncedValue,
  usePointer,
} from './common.ts';
import { DocUrl } from './u.ts';
import { ActionButton } from './ui.ActionButton.tsx';
import { Prefix } from './ui.Prefix.tsx';
import { Suffix } from './ui.Suffix.tsx';
import { useController } from './use.Controller.ts';

type P = t.DocumentIdProps;

export const View: React.FC<P> = (props) => {
  const { label, autoFocus = D.autoFocus, enabled = D.enabled, readOnly = D.readOnly } = props;

  /**
   * Refs:
   */
  const readyFiredRef = useRef(false);
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
  const { textbox, docId, doc, repo, is, url, urlKey } = controller.props;
  const getCurrentHref = () => (docId ? DocUrl.resolve(url, docId, urlKey) : undefined);

  const active = enabled && !!repo;
  const transient = controller.transient;

  let showActionD = useDebouncedValue(controller.ready && is.enabled.action && !readOnly, 50);
  let showAction = showActionD || !textbox;

  /**
   * Effect: read in doc-id passed on the URL.
   */
  React.useEffect(() => {
    if (!url) return; // Only relevant when URL support is enabled.
    const { docId } = DocUrl.read(location.href, urlKey);
    if (docId) controller.signals.textbox.value = docId;
  }, []);

  /**
   * Effect: (mounted).
   */
  React.useEffect(() => {
    if (!repo) return;
    const life = rx.disposable();
    const signals = controller.signals;

    const fireChanged = () => props.onChange?.(payload());
    const payload = (): t.DocumentIdChanged => {
      const is = { head: (doc && doc.id === docId) ?? false };
      const values = signals.toValues();
      return { is, signals, values, repo };
    };

    // Bubble change events:
    const doc = signals.doc.value;
    const events = doc?.events(life);
    events?.$.subscribe(fireChanged);

    // Alert listeners:
    if (!readyFiredRef.current) {
      props.onReady?.(payload());
      readyFiredRef.current = true;
    }
    fireChanged();

    return life.dispose;
  }, [repo?.id.instance, doc?.id, docId, textbox]);

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      position: 'relative',
      height: 30,
      fontSize: 14,
      color: theme.fg,
      backgroundColor: theme.format(props.background).bg,
      lineHeight: 'normal',
      display: 'grid',
      gridTemplateColumns: showAction ? '1fr auto' : '1fr',
      alignItems: 'stretch',
    }),
    textbox: css({ fontSize: 14 }),
    label: css({
      Absolute: [-20, null, null, 5],
      userSelect: 'none',
      fontSize: 11,
      fontWeight: 600,
      textTransform: 'uppercase',
      opacity: props.labelOpacity ?? 0.4,
    }),
    actionButton: css({
      fontSize: 12,
      marginLeft: 3,
      ...props.buttonStyle,
    }),
    message: css({
      Absolute: [0, null, 0, 30],
      pointerEvents: 'none',
      paddingBottom: 3,
      color: Color.BLUE,
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
      transientMessageShowing={!!transient.message}
      url={url}
      urlKey={urlKey}
      onCopyClick={(e) => {
        const href = getCurrentHref();
        if (href) {
          const action: t.DocumentIdAction = e.mode === 'url' ? 'Copy:Url' : 'Copy';
          const cmd = Kbd.Is.command(e.modifiers);
          const { shift } = e.modifiers;
          const addressbarAction = cmd && shift ? 'remove' : 'add';
          controller.handlers.onAction({ action, href, addressbarAction });
        }
      }}
      onPointer={(e) => {
        if (e.is.down) {
          e.preventDefault();
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
      onClearClick={() => controller.handlers.onAction({ action: 'Clear' })}
      onPointer={(e) => {
        if (e.is.down) {
          e.preventDefault();
          focus();
        }
      }}
    />
  );

  const elMessage = transient.message && (
    <div className={styles.message.class}>{transient.message}</div>
  );

  const elActionButton = showAction && (
    <ActionButton
      style={styles.actionButton}
      action={controller.props.action?.action}
      enabled={active && is.enabled.action}
      parentOver={textboxOver}
      parentFocused={focused}
      onClick={() => {
        const { action } = controller.props;
        controller.handlers.onAction(action);
      }}
    />
  );

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={styles.label.class}>{label}</div>
      <div {...pointer.handlers}>
        <TextInput
          value={textbox}
          prefix={elPrefix}
          suffix={elSuffix}
          placeholder={wrangle.placeholder(props, controller, focused)}
          disabled={!(active && is.enabled.input)}
          readOnly={readOnly}
          //
          theme={theme.name}
          style={styles.textbox}
          inputStyle={{
            opacity: !!transient.message ? 0.1 : 1,
            blur: !!transient.message ? 8 : 0,
          }}
          border={{ mode: 'underline', defaultColor: 0 }}
          background={0}
          autoFocus={!readOnly && autoFocus}
          //
          onReady={(e) => (inputRef.current = e.input)}
          onChange={controller.handlers.onTextChange}
          onKeyDown={controller.handlers.onKeyDown}
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
    if (focused && controller.history.length > 0) return `${D.placeholder}  •  ↑↓ for history`;
    return D.placeholder;
  },
} as const;
