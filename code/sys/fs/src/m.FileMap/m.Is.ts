import { Is as IsBase, MediaType, Path, type t } from './common.ts';

export const Is: t.FileMap.Is.Lib = Object.freeze({
  fileMap(input): input is t.FileMap {
    if (!IsBase.record(input)) return false;
    for (const value of Object.values(input)) {
      if (!IsBase.string(value)) return false;
    }
    return true;
  },

  dataUri: (input) => IsBase.string(input) && MediaType.fromDataUri(input) !== undefined,

  dotfile(input) {
    const filename = Path.basename(input);
    return filename.startsWith('.') && (filename.match(/\./g) || []).length === 1;
  },

  supported: Object.freeze<t.FileMap.Is.Lib['supported']>({
    contentType: (mediaType) => MediaType.Is.valid(mediaType),
  }),

  contentType: Object.freeze<t.FileMap.Is.Lib['contentType']>({
    string: (mediaType) => MediaType.Is.text(mediaType),
    binary: (mediaType) => MediaType.Is.binary(mediaType),
  }),
});
