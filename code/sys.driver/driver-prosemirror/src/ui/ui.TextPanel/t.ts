import type { t } from './common.ts';

/** Props for the labeled CRDT-backed ProseMirror text panel. */
export type TextPanelProps = {
  /** Label rendered above the editor field. */
  label?: string;
  /** The CRDT document to edit. */
  doc?: t.Crdt.Ref;
  /** Object path within the CRDT document to bind. */
  path?: t.ObjectPath;

  /** Renders debug background color when enabled. */
  debug?: boolean;
  /** Emits missing `doc` or `path` warnings when enabled. */
  warnings?: boolean;

  /** Color theme used to render the panel. */
  theme?: t.CommonTheme;
  /** Optional style override for the panel container. */
  style?: t.CssInput;
  /** Opacity applied to the label. */
  labelOpacity?: t.Percent;
  /** Grid row gap between label and editor. */
  rowGap?: t.Percent;
  /** Enables scrolling within the editor. */
  scroll?: boolean;
};
