import { type t } from './common.ts';
import { Kind } from './m.const.kind.ts';
import { parse } from './m.parse.ts';

/** Files cursor type guards. */
export const IsCursor: t.Files.Cursor.IsLib = {
  cursor(input: unknown): input is t.Files.String.Cursor {
    return parse(input) !== undefined;
  },
  list(input: unknown): input is t.Files.Cursor.List {
    return parse(input)?.kind === Kind.list;
  },
  watch(input: unknown): input is t.Files.Cursor.Watch {
    return parse(input)?.kind === Kind.watch;
  },
  manifest(input: unknown): input is t.Files.Cursor.Manifest {
    return parse(input)?.kind === Kind.manifest;
  },
  kind<K extends t.Files.Cursor.Kind>(kind: K, input: unknown): input is t.Files.String.Cursor<K> {
    return parse(input)?.kind === kind;
  },
};
