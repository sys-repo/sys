import type { t } from './common.ts';

/**
 * HTML5 File-System Types.
 */
type Entry = FileEntry | DirectoryEntry;

type EntryPath = {
  name: string;
  fullPath: string;
};

type FileEntry = EntryPath & {
  isFile: true;
  isDirectory: false;
  file(success: (file: File) => void, fail?: (error: Error) => void): void;
};

type DirectoryEntry = EntryPath & {
  isFile: false;
  isDirectory: true;
  createReader(): DirectoryReader;
};

type DirectoryReader = {
  readEntries(
    success: (results: (FileEntry | DirectoryEntry)[]) => void,
    fail?: (error: Error) => void,
  ): void;
};

/**
 * Read out file data from a drag-drop-event.
 */
export async function readDropEvent(e: DragEvent) {
  const files: t.DroppedFile[] = [];
  const urls: string[] = [];

  const process = async (item: DataTransferItem) => {
    if (item.kind === 'string') {
      const text = await readString(item);
      if (isUrl(text)) urls.push(text);
    } else if (typeof item.webkitGetAsEntry === 'function') {
      /**
       * Webkit advanced file API.
       * NB: This allows reading in full directories.
       */
      const entry = item.webkitGetAsEntry() as Entry | null;
      if (entry === null) {
        throw new Error('Nothing dropped: item.webkitGetAsEntry() is null');
      }

      if (entry.isFile) {
        const file = await readFile(entry);
        files.push(file);
      }

      if (entry.isDirectory) {
        const dir = await readDir(entry);
        dir.forEach((file) => files.push(file));
      }
    } else {
      /**
       * Standard DOM drop handler.
       */
      if (item.kind === 'file') {
        const file = item.getAsFile();
        if (file) files.push(await toFilePayload(file));
      }
    }
  };

  const items = toDataTransferItemArray(e.dataTransfer?.items);
  await Promise.all(items.map(process));

  // Remove root "/" character.
  files.forEach((file) => (file.path = file.path.replace(/^\//, '')));

  // Finish up.
  return { files, urls };
}

/**
 * [Helpers]
 */

function toDataTransferItemArray(items?: DataTransferItemList): DataTransferItem[] {
  const list: DataTransferItem[] = [];
  if (items) {
    for (let i = 0; i < items.length; i++) {
      list.push(items[i]);
    }
  }
  return list;
}

async function toFilePayload(file: File, name?: string) {
  const path = name || file.name;
  const mimetype = file.type || 'application/octet-stream';
  const data = new Uint8Array(await (file as any).arrayBuffer());
  const payload: t.DroppedFile = {
    path,
    data,
    mimetype,
    toFile(path?: string) {
      const filename = path ?? payload.path;
      return new File([data], filename, { type: mimetype });
    },
  };
  return payload;
}

function readString(item: DataTransferItem) {
  return new Promise<string>((resolve, reject) => {
    item.getAsString((text) => resolve(text));
  });
}

function readFile(entry: FileEntry) {
  return new Promise<t.DroppedFile>((resolve, reject) => {
    entry.file(
      async (file) => resolve(await toFilePayload(file, entry.fullPath)),
      (error) => reject(error),
    );
  });
}

function readDir(entry: DirectoryEntry) {
  return new Promise<t.DroppedFile[]>(async (resolve, reject) => {
    try {
      const files = await readEntries(entry);
      const result = await Promise.all(files.map((file) => readFile(file)));
      resolve(result);
    } catch (error: any) {
      reject(error);
    }
  });
}

function readEntries(dir: DirectoryEntry) {
  return new Promise<FileEntry[]>(async (resolve, reject) => {
    const files: FileEntry[] = [];
    dir.createReader().readEntries(
      async (results: (FileEntry | DirectoryEntry)[]) => {
        for (const item of results) {
          if (item.isFile) files.push(item);

          if (item.isDirectory) {
            const children = await readEntries(item);
            children.forEach((file) => files.push(file));
          }
        }
        resolve(files);
      },
      (error: Error) => reject(error),
    );
  });
}

function isUrl(text: string) {
  text = (text || '').trim();
  return text.startsWith('https://') || text.startsWith('http://');
}
