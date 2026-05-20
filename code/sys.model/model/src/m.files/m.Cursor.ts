import { Err, Is, type t } from './common.ts';

const prefix: t.FilesCursor.Prefix = 'files:cursor';
const version: t.FilesCursor.Version = 'v1';

const Kind: t.FilesCursor.KindMap = {
  list: 'list',
  watch: 'watch',
  manifest: 'manifest',
};

const isKind = (input: unknown): input is t.FilesCursor.Kind => {
  return input === Kind.list || input === Kind.watch || input === Kind.manifest;
};

const isToken = (input: unknown): input is t.FilesCursor.Token => {
  return Is.string(input) && input.length > 0;
};

const fail = (message: string) => Err.std(message, { name: 'FilesCursorError' });

const create = <K extends t.FilesCursor.Kind>(kind: K, token: t.FilesCursor.Token) => {
  if (!isKind(kind)) throw fail(`Invalid Files cursor kind: ${String(kind)}`);
  if (!isToken(token)) throw fail('Files cursor token must be a non-empty string');
  return `${prefix}:${kind}:${version}:${token}` as t.Files.StringCursor<K>;
};

const toParsed = <K extends t.FilesCursor.Kind>(
  kind: K,
  token: t.FilesCursor.Token,
  value: t.Files.StringCursor<K>,
): t.FilesCursor.Parsed.Shape<K> => {
  return { prefix, kind, version, token, value };
};

const parse = (input: unknown): t.FilesCursor.Parsed | undefined => {
  if (!Is.string(input)) return undefined;

  const parts = input.split(':');
  if (parts.length < 5) return undefined;

  const [segment0, segment1, kind, cursorVersion, ...tokenParts] = parts;
  if (`${segment0}:${segment1}` !== prefix) return undefined;
  if (!isKind(kind)) return undefined;
  if (cursorVersion !== version) return undefined;

  const token = tokenParts.join(':');
  if (!isToken(token)) return undefined;

  if (kind === Kind.list) return toParsed(kind, token, input as t.FilesCursor.List);
  if (kind === Kind.watch) return toParsed(kind, token, input as t.FilesCursor.Watch);
  return toParsed(kind, token, input as t.FilesCursor.Manifest);
};

const IsCursor: t.FilesCursor.IsLib = {
  cursor(input: unknown): input is t.Files.StringCursor {
    return parse(input) !== undefined;
  },
  list(input: unknown): input is t.FilesCursor.List {
    return parse(input)?.kind === Kind.list;
  },
  watch(input: unknown): input is t.FilesCursor.Watch {
    return parse(input)?.kind === Kind.watch;
  },
  manifest(input: unknown): input is t.FilesCursor.Manifest {
    return parse(input)?.kind === Kind.manifest;
  },
  kind<K extends t.FilesCursor.Kind>(kind: K, input: unknown): input is t.Files.StringCursor<K> {
    return parse(input)?.kind === kind;
  },
};

/** Cursor codec for paged Files command surfaces. */
export const Cursor: t.FilesCursor.Lib = {
  prefix,
  version,
  Kind,
  Is: IsCursor,
  create,
  parse,
};
