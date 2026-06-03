import { Is, Obj, type t } from './common.ts';

const CUSTOM_METADATA_PREFIX = 'x-amz-meta-';

type MetadataEntry = {
  readonly key: string;
  readonly lowerKey: string;
  readonly value: string;
};

/** Convert substrate object metadata to the R2-shaped public object stat result. */
export function toObjectMeta(input: t.S3ObjectStatus): t.R2.ObjectMeta {
  return {
    key: input.key,
    size: input.size,
    etag: input.etag,
    modifiedAt: input.lastModified,
    version: input.versionId ?? undefined,
    metadata: fromS3Metadata(input.metadata),
  };
}

/** Convert R2-shaped write options to substrate metadata headers. */
export function toS3Metadata(input: t.R2.Bucket.Write.Options | undefined): t.S3ObjectMetadata {
  const metadata: Record<string, string> = {};
  if (!input) return metadata as t.S3ObjectMetadata;
  if (input.mediaType) metadata['Content-Type'] = input.mediaType;
  if (input.cacheControl) metadata['Cache-Control'] = input.cacheControl;
  if (input.contentEncoding) metadata['Content-Encoding'] = input.contentEncoding;

  const custom = input.custom ?? {};
  for (const { key, value } of Obj.toArray<Record<string, string>>(custom)) {
    if (Is.str(value)) metadata[`${CUSTOM_METADATA_PREFIX}${String(key)}`] = value;
  }

  return metadata as t.S3ObjectMetadata;
}

/** Convert substrate metadata headers to R2-shaped metadata. */
export function fromS3Metadata(
  input: t.S3ObjectMetadata | undefined,
): t.R2.ObjectMetadata | undefined {
  if (!input) return undefined;
  const entries = toMetadataEntries(input);
  const custom: Record<string, string> = {};
  for (const entry of entries) {
    if (!entry.lowerKey.startsWith(CUSTOM_METADATA_PREFIX)) continue;
    custom[entry.key.slice(CUSTOM_METADATA_PREFIX.length)] = entry.value;
  }

  const metadata: Record<string, unknown> = {};
  const mediaType = metadataValue(entries, 'content-type');
  const cacheControl = metadataValue(entries, 'cache-control');
  const contentEncoding = metadataValue(entries, 'content-encoding');

  if (!Is.nil(mediaType)) metadata.mediaType = mediaType;
  if (!Is.nil(cacheControl)) metadata.cacheControl = cacheControl;
  if (!Is.nil(contentEncoding)) metadata.contentEncoding = contentEncoding;
  if (Obj.keys(custom).length > 0) metadata.custom = custom;

  return Obj.keys(metadata).length > 0 ? metadata as t.R2.ObjectMetadata : undefined;
}

function toMetadataEntries(input: t.S3ObjectMetadata): readonly MetadataEntry[] {
  const entries: MetadataEntry[] = [];
  for (
    const { key, value } of Obj.toArray<Record<string, string>>(input as Record<string, string>)
  ) {
    if (!Is.str(value)) continue;
    const name = String(key);
    entries.push({ key: name, lowerKey: name.toLowerCase(), value });
  }
  return entries;
}

function metadataValue(entries: readonly MetadataEntry[], lowerKey: string): string | undefined {
  return entries.find((entry) => entry.lowerKey === lowerKey)?.value;
}
