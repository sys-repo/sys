import { type t } from './common.ts';

export const defaultKeyBindings = (monaco?: t.Monaco.Monaco) => {
  if (!monaco) return;

  /**
   * Release `CMD + L` to allow browser to place focus on URL.
   * unbindKeybinding(editor, monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyL);
   */
  monaco.editor.addKeybindingRule({
    keybinding: monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyL, // ⌘/Ctrl + L
    command: null, // ← null == unbind
    when: null, //    ← null == every context
  });
};

export const toKeyDownEvent = (
  _editor: t.Monaco.Editor,
  _monaco: t.Monaco.Monaco,
  event: t.Monaco.I.IKeyboardEvent,
): t.MonacoEditorKeyDown => {
  const key = event.browserEvent.key || event.code || '';
  const modifiers = {
    shift: !!event.shiftKey,
    alt: !!event.altKey,
    ctrl: !!event.ctrlKey,
    meta: !!event.metaKey,
  } satisfies t.KeyboardModifierFlags;

  return {
    event,
    key,
    modifiers,
    preventDefault() {
      event.preventDefault();
    },
    stopPropagation() {
      event.stopPropagation();
    },
  };
};
