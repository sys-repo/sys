import type { t } from './common.ts';

/** Props for the CRDT-backed ProseMirror text editor component. */
export type TextEditorProps = {
  /** The CRDT to record onto. */
  doc?: t.Crdt.Ref<any>;
  /** The path within the CRDT to target. */
  path?: t.ObjectPath;

  /**
   * Flags:
   */
  /** Suppress editing of the document. */
  readOnly?: boolean;
  /** Auto-focus the input on mount; pass an incrementing number to re-apply focus. */
  autoFocus?: boolean | number;
  /** Scroll enabled.  */
  scroll?: boolean;
  /** Single or multi-line text. */
  singleLine?: boolean;

  /**
   * Appearance:
   */
  /** Renders debug background color when enabled. */
  debug?: boolean;
  /** Color theme used to render the editor. */
  theme?: t.CommonTheme;
  /** Optional style override for the editor container. */
  style?: t.CssInput;
};
