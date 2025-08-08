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
