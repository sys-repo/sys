import React from 'react';
import {
  type t,
  Button,
  Color,
  css,
  D,
  Icons,
  Obj,
  ObjectView,
  Str,
  usePointer,
  UserAgent,
  useRedrawEffect,
} from './common.ts';
import { Binary } from './m.Binary.ts';
import { downloadFile, dragdropFile, Fmt } from './u.ts';
import { DropTarget } from './ui.DropTarget.tsx';

export const BinaryFile: React.FC<t.BinaryFileProps> = (props) => {
  const { doc, path = ['files'], debug = false } = props;
  const ua = UserAgent.current;

  const filemap = Obj.Path.get<t.BinaryFileMap>(doc?.current, path, {});

  /**
   * Hooks:
   */
  useRedrawEffect(doc, path);
  const pointer = usePointer({
    onDrag(e) {},
    async onDragdrop(e) {
      if (!doc) return;
      if (e.action === 'Drop') {
        const files = await Promise.all(e.files.map(Binary.fromBrowserFile));

        if (doc) {
          doc.change((d) => {
            const target = Obj.Path.Mutate.ensure<t.BinaryFileMap>(d, path, {});


            files.forEach((file) => {
              if (target[file.hash]) {
              } else {
                target[file.hash] = file;
              }
            });
          });
        }
      }
    },
  });

  /**
   * Handlers:
   */
  const downloadClickHandler = (hash: t.StringHash) => {
    return () => downloadFile(filemap[hash]);
  };
  const dragStartHandler = (hash: t.StringHash) => {
    if (!ua.is.chromium) return; // NB: drag-n-drop download only supported in Chromium browsers.
    return (e: React.DragEvent) => dragdropFile(e.dataTransfer, filemap[hash]);
  };

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      backgroundColor: Color.ruby(debug),
      color: theme.fg,
      padding: 10,
      userSelect: 'none',
      display: 'grid',
      gridTemplateRows: `1fr auto`,
    }),
    top: css({ display: 'grid' }),
    bottom: css({ display: 'grid' }),
    file: {
      base: css({
        marginTop: 10,
        backgroundColor: 'rgba(255, 0, 0, 0.15)' /* RED */,
        border: `solid 1px ${Color.alpha(theme.fg, 0.1)}`,
        padding: 10,
        fontSize: 12,
        display: 'grid',
        gridTemplateColumns: 'auto 1fr auto',
        columnGap: 10,
        alignItems: 'center',
      }),
    },
  };

  const elObject = (
    <ObjectView
      name={'file-drop'}
      data={{
        doc: doc?.id,
        path,
        filemap: Fmt.fileMap(filemap),
        // pointer: pointer.is,
      }}
      theme={theme.name}
      style={{ marginTop: 20, marginLeft: 10 }}
      expand={{ level: 1, paths: ['$', '$.pointer'] }}
    />
  );

  const elFiles = Object.entries(filemap).map(([hash, file]) => {
    return (
      <div
        key={hash}
        className={styles.file.base.class}
        draggable={ua.is.chromium}
        onDragStart={dragStartHandler(hash)}
      >
        <Icons.File.Binary size={28} />
        <div>{`name:${file.name}, bytes:${Str.bytes(file.bytes.length)}, type:${file.type}`}</div>
        <Button theme={theme.name} onClick={downloadClickHandler(hash)}>
          <Icons.Download size={20} />
        </Button>
      </div>
    );
  });

  const elDropMessage = !debug && (
    <DropTarget isDragdropping={pointer.is.dragdropping} doc={doc} theme={theme.name} />
  );

  const elDebug = debug && (
    <div>
      <div>{`🐷 ${D.displayName}`}</div>
      {elObject}
    </div>
  );

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={styles.top.class} {...pointer.handlers}>
        {elDebug}
        {elDropMessage}
      </div>
      <div className={styles.bottom.class}>{elFiles}</div>
    </div>
  );
};
