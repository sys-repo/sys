import { Is, Obj, type t } from '../common.ts';

export const BODY_META = 'sys.files.body';
export const ENCODING_META = 'sys.files.encoding';
export const ENCODING = 'utf8' satisfies t.Files.Encoding;
export const ENCODINGS = Object.freeze([ENCODING] satisfies readonly t.Files.Encoding[]);

/** Internal body marker written to R2 custom metadata. */
export type BodyKind = 'text' | 'bytes';

/** Build R2 custom metadata that marks Files-written objects. */
export function writeCustomMetadata(kind: BodyKind): t.R2.MetadataCustom {
  return Object.freeze({
    [BODY_META]: kind,
    ...(kind === 'text' ? { [ENCODING_META]: ENCODING } : {}),
  });
}

/** Case-insensitive lookup in R2 custom object metadata. */
export function customValue(
  metadata: t.R2.ObjectMetadata | undefined,
  key: string,
): string | undefined {
  const custom = metadata?.custom;
  if (!custom) return undefined;
  const lower = key.toLowerCase();
  for (const entry of Obj.toArray<Record<string, string>>(custom as Record<string, string>)) {
    if (!Is.string(entry.value)) continue;
    if (String(entry.key).toLowerCase() === lower) return entry.value;
  }
  return undefined;
}

/** True when provider metadata marks this object as Files text. */
export function isFilesText(metadata: t.R2.ObjectMetadata | undefined): boolean {
  return customValue(metadata, BODY_META) === 'text' &&
    customValue(metadata, ENCODING_META) === ENCODING;
}
