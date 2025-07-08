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
  Time,
  usePointer,
  UserAgent,
  useRedrawEffect,
} from './common.ts';
import { Binary } from './m.Binary.ts';
import { Fmt } from './u.ts';

export const BinaryFile: React.FC<t.BinaryFileProps> = (props) => {
  const { doc, path = ['files'], debug = false } = props;
  const ua = UserAgent.current;
  const filemap = Obj.Path.get<t.BinaryFileMap>(doc?.current, path, {});

  /**
   * Hooks:
   */
  useRedrawEffect(doc, path);
  const pointer = usePointer({
    onDrag(e) {
      // console.log('onDrag', e);
    },
    async onDragdrop(e) {
      if (e.action === 'Drop') {
        const files = await Promise.all(e.files.map(Binary.fromBrowserFile));

        if (doc) {
          doc.change((d) => {
            const target = Obj.Path.Mutate.ensure<t.BinaryFileMap>(d, path, {});

            files.forEach((file) => {
              //
              if (target[file.hash]) {
                console.log('TODO 🐷', 'add meta-data - convert to array.');
              } else {
                target[file.hash] = file;
              }
            });
            // Obj.Path.mutate(d, path, filemap);
          });
        }
      }
    },
  });

  /**
   * Handlers:
   */
  const dragStartHandler = (hash: t.StringHash) => {
    // NB: drag-n-drop download only supported in Chromium browsers.
    if (!ua.is.chromium) return;

    return (e: React.DragEvent<HTMLDivElement>) => {
      const entries = Obj.entries(filemap);
      if (entries.length === 0) return;

      const dataTransfer = (f: t.BinaryFile) => {
        const file = Binary.toBrowserFile(f);

        /** Modern – Chrome 86+, Edge, Safari 17 */
        e.dataTransfer.items.add(file); // copies bytes into the drag payload

        /** Fallback (old Chrome / Electron) */
        const url = URL.createObjectURL(file);
        // Non-standard but still handy:
        e.dataTransfer.setData('DownloadURL', `${file.type}:${file.name}:${url}`);

        /** Plain-text name so other targets at least get a string. */
        e.dataTransfer.setData('text/plain', file.name);

        e.dataTransfer.effectAllowed = 'copy';
      };

      const file = filemap[hash];
      if (file) dataTransfer(file);
    };
  };

  const downloadClickHandler = (hash: t.StringHash) => {
    return () => {
      const file = filemap[hash];
      // if (file) dataTransfer(file);
      // console.log('download', file);

      // 1 Wrap bytes in a Blob and create an in-memory URL
      const blob = new Blob([file.bytes], { type: file.type || 'application/octet-stream' });
      const url = URL.createObjectURL(blob);

      // 2 Create a temporary <a download> link and click it
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name; // filename in the “Save as…” dialog
      document.body.appendChild(a);
      a.click(); // ⬇️ starts the download
      a.remove();

      // 3 Tidy up the object-URL after the click has propagated
      // setTimeout(() => URL.revokeObjectURL(url), 0);
      Time.delay(0, () => URL.revokeObjectURL(url));
    };
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
    dropMsg: css({
      display: 'grid',
      placeItems: 'center',
      backgroundColor: 'rgba(255, 0, 0, 0.1)' /* RED */,
    }),
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
        path,
        files: Fmt.files(filemap),
        filemap,
        pointer: pointer.is,
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

  const elDropMessage = !debug && <div className={styles.dropMsg.class}>{'Drop files here'}</div>;
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
