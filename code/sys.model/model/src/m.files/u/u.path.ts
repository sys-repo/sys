import { Path, type t } from '../common.ts';

export type PathOps = t.PathBounded.Ops;
export type PosixPathOps = t.PathBounded.PosixOps & {
  readonly Is: { readonly absolute: (path: t.StringPath) => boolean };
};
export type InvalidPath = t.PathBounded.Invalid;

export type FilesPathLib = {
  readonly Is: {
    readonly windowsDrive: (input: t.StringPath) => boolean;
  };
  readonly visible: (ops: PathOps, input: unknown, invalid: InvalidPath) => t.Files.String.Path;
  readonly parent: (input: t.Files.String.Path, invalid?: InvalidPath) => t.Files.String.Path;
  readonly posix: () => PosixPathOps;
};

const defaultInvalid: InvalidPath = (message) => new Error(message);

/** Shared Files path helpers for root-relative Files-visible paths. */
export const FilesPath: FilesPathLib = Object.freeze({
  Is: Path.Bounded.Is,

  visible(ops, input, invalid) {
    return Path.Bounded.visible(ops, input, filesInvalid(invalid)) as t.Files.String.Path;
  },

  parent(input, invalid = defaultInvalid) {
    return Path.Bounded.parent(input, filesInvalid(invalid)) as t.Files.String.Path;
  },

  posix() {
    return POSIX_PATH;
  },
});

const STD_POSIX = Path.Bounded.posix();
const POSIX_IS = Object.freeze({ absolute: STD_POSIX.isAbsolute });

const POSIX_PATH: PosixPathOps = Object.freeze({
  ...STD_POSIX,
  Is: POSIX_IS,
});

function filesInvalid(invalid: InvalidPath): InvalidPath {
  return (message) => invalid(toFilesPathMessage(message));
}

function toFilesPathMessage(message: string): string {
  return message.startsWith('Path ') ? `Files path ${message.slice('Path '.length)}` : message;
}
