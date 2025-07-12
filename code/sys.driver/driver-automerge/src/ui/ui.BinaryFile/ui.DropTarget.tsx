import React from 'react';
import { type t, Color, css, Time, usePointer } from './common.ts';
import { Binary } from './m.Binary.ts';
import { LooksLike } from './u.LooksLike.ts';

export type DropTargetProps = {
  doc?: t.Crdt.Ref;
  isDragdropping?: boolean;
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
  onPaste?: DropTargetPasteHandler;
};

export type DropTargetPasteHandler = (e: DropTargetPaste) => void;
export type DropTargetPaste = {
  readonly files: t.BinaryFile[];
  readonly clipboardData: DataTransfer;
};

/**
 * Component:
 */
export const DropTarget: React.FC<DropTargetProps> = (props) => {
  const { doc, isDragdropping = false } = props;

  /**
   * Hooks:
   */
  const pointer = usePointer();
  const showBorder = pointer.is.focused || isDragdropping;

  // Prepare display message:
  const action = pointer.is.focused ? 'Paste or drag' : 'Drag';
  let msg = isDragdropping ? 'Drop file here' : `${action} file here`;
  if (!doc) msg = '( Drop target not ready )';

  /**
   * Handlers:
   */
  const handlePaste: React.ClipboardEventHandler = async (e) => {
    const { clipboardData } = e;
    if (!doc) return;
    if (!clipboardData) return;
    e.preventDefault(); // Override default behavior.

    // Binary-encode any native files in the clipboard.
    const files = await Binary.fromClipboard(clipboardData);

    // If plain-text is present, wrap it in a plain-text file and encode.
    const text = clipboardData.getData('text/plain');
    if (text) {
      const info = wrangle.filemeta(text, 'paste');
      const { lastModified, filename, type } = info;
      const textFile = new File([text], filename, { type, lastModified });
      files.push(await Binary.fromBrowserFile(textFile));
    }

    // Alert listeners:
    props.onPaste?.({ files, clipboardData });
  };

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      position: 'relative',
      color: theme.fg,
      outline: 'none',
      display: 'grid',
      placeItems: 'center',
    }),
    label: css({
      userSelect: 'none',
      opacity: doc ? 1 : 0.2,
      transition: `opacity 120ms ease`,
    }),
    border: css({
      pointerEvents: 'none',
      Absolute: 10,
      border: `dashed 1px ${Color.alpha(Color.BLUE, 0.8)}`,
      borderRadius: 20,
    }),
  };

  const elBorder = showBorder && <div className={styles.border.class}></div>;

  return (
    <div
      {...pointer.handlers}
      tabIndex={0}
      className={css(styles.base, props.style).class}
      onPaste={handlePaste}
    >
      <div className={styles.label.class}>{msg}</div>
      {elBorder}
    </div>
  );
};

/**
 * Helpers:
 */
const wrangle = {
  filemeta(src: string, name = 'paste') {
    const lastModified = Time.now.timestamp;
    const lookslike = LooksLike.check(src);

    let type: string;
    let ext: string;
    switch (true) {
      case lookslike.markdown:
        type = 'text/markdown';
        ext = 'md';
        break;
      case lookslike.yaml:
        type = 'text/yaml';
        ext = 'yaml';
        break;
      default:
        type = 'text/plain';
        ext = 'txt';
    }

    const filename = `${name}.${ext}`;
    return { lastModified, type, name, filename, ext } as const;
  },
} as const;
