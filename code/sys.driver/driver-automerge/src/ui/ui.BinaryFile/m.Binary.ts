import { type t, Hash } from './common.ts';

export const Binary: t.BinaryLib = {
  toBrowserFile(file) {
    const blob = new Blob([file.bytes], { type: file.type });
    return new File([blob], file.name, {
      type: file.type,
      lastModified: file.modifiedAt,
    });
  },

  async fromBrowserFile(file) {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const hash = Hash.sha256(bytes);
    return {
      bytes,
      name: file.name,
      type: file.type || 'application/octet-stream',
      modifiedAt: file.lastModified,
      hash,
    };
  },

  async fromClipboard(clipboardData: DataTransfer) {
    const files = Array.from(clipboardData.files);
    return await Promise.all(files.map((file) => Binary.fromBrowserFile(file)));
  },
};
