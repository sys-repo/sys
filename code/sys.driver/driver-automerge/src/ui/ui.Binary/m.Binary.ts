import { type t, File as FileUtil, Hash } from './common.ts';
import { BinaryFile as View } from './ui.tsx';

export const Binary: t.BinaryLib = {
  View,

  toBrowserFile(file) {
    const { bytes, type, name, modifiedAt } = file;
    return FileUtil.toFile({ bytes, type, name, modifiedAt });
  },

  async fromBrowserFile(file) {
    return FileUtil.fromFile(file, { computeHash: (bytes) => Hash.sha256(bytes) });
  },

  async fromClipboard(clipboardData: DataTransfer) {
    const files = Array.from(clipboardData.files);
    return await Promise.all(files.map((file) => Binary.fromBrowserFile(file)));
  },
};
