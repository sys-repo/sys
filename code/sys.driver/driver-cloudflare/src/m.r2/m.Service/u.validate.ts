import { Err, Is, Num, Obj, Str, type t, Url } from './common.ts';

const ACCOUNT_ID_PATTERN = /^[a-f0-9]{32}$/i;
const CUSTOM_METADATA_KEY_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;

/** Normalize and validate a Cloudflare account ID. */
export function toAccountId(input: unknown): string {
  const accountId = requireText(input, 'accountId').toLowerCase();
  if (!ACCOUNT_ID_PATTERN.test(accountId)) {
    throw Err.std(`R2 accountId must be a 32 character Cloudflare account ID.`);
  }
  return accountId;
}

/** Freeze normalized R2 credentials. */
export function freezeCredentials(input: t.R2.Credentials): t.R2.Credentials {
  const credentials: Record<string, string> = {
    accessKeyId: requireText(input.accessKeyId, 'credentials.accessKeyId'),
    secretAccessKey: requireText(input.secretAccessKey, 'credentials.secretAccessKey'),
  };
  if (!Is.nil(input.sessionToken)) {
    credentials.sessionToken = requireText(input.sessionToken, 'credentials.sessionToken');
  }
  return Object.freeze(credentials) as t.R2.Credentials;
}

/** Normalize a bucket read origin URL. */
export function toReadOrigin(input: string | undefined): string | undefined {
  if (Is.nil(input)) return undefined;
  if (!Is.urlString(input)) throw Err.std(`R2 bucket readOrigin must be an absolute http(s) URL.`);
  return Url.normalize(input);
}

/** Normalize and validate rootless object keys. */
export function toObjectKey(input: string): string {
  const key = requireNonBlankString(input, 'object key');
  if (Str.trimLeadingSlashes(key) !== key || Str.trimLeadingDotSlash(key) !== key) {
    throw Err.std(`R2 object key must be rootless: ${key}`);
  }
  return key;
}

/** Normalize bucket write options. */
export function toWriteOptions(
  input: t.R2.Bucket.Write.Options | undefined,
): t.R2.Bucket.Write.Options | undefined {
  if (!input) return undefined;
  const options: Record<string, unknown> = {};
  if (!Is.nil(input.mediaType)) options.mediaType = requireText(input.mediaType, 'write.mediaType');
  if (!Is.nil(input.cacheControl)) {
    options.cacheControl = requireText(input.cacheControl, 'write.cacheControl');
  }
  if (!Is.nil(input.contentEncoding)) {
    options.contentEncoding = requireText(input.contentEncoding, 'write.contentEncoding');
  }
  if (!Is.nil(input.size)) options.size = toNonNegativeInteger(input.size, 'write.size');
  const custom = toCustomMetadata(input.custom);
  if (custom) options.custom = custom;
  return Object.freeze(options) as t.R2.Bucket.Write.Options;
}

/** Normalize list options. */
export function toListOptions(
  input: t.R2.Bucket.ListOptions | undefined,
): t.R2.Bucket.ListOptions | undefined {
  if (!input) return undefined;
  const options: Record<string, unknown> = {};
  if (!Is.nil(input.prefix)) options.prefix = toPrefix(input.prefix);
  if (!Is.nil(input.limit)) options.limit = toNonNegativeInteger(input.limit, 'list.limit');
  if (!Is.nil(input.pageSize)) {
    options.pageSize = toNonNegativeInteger(input.pageSize, 'list.pageSize');
  }
  return Obj.keys(options).length > 0
    ? Object.freeze(options) as t.R2.Bucket.ListOptions
    : undefined;
}

/** Require non-blank text and trim incidental boundary whitespace. */
export function requireText(input: unknown, label: string): string {
  if (!Is.str(input) || input.trim().length === 0) throw Err.std(`R2 ${label} is required.`);
  return input.trim();
}

function requireNonBlankString(input: unknown, label: string): string {
  if (!Is.str(input) || input.trim().length === 0) throw Err.std(`R2 ${label} is required.`);
  return input;
}

function toCustomMetadata(input: t.R2.MetadataCustom | undefined): t.R2.MetadataCustom | undefined {
  if (Is.nil(input)) return undefined;
  if (!Is.record<Record<string, unknown>>(input)) {
    throw Err.std(`R2 custom metadata must be a record.`);
  }

  const custom: Record<string, string> = {};
  for (const key of Obj.keys(input)) {
    const name = String(key);
    const value = input[name];
    const lower = name.toLowerCase();
    if (lower.startsWith('x-amz-')) {
      throw Err.std(`R2 custom metadata keys must not include provider prefixes: ${name}`);
    }
    if (!CUSTOM_METADATA_KEY_PATTERN.test(name)) {
      throw Err.std(`R2 custom metadata key contains invalid characters: ${name}`);
    }
    if (!Is.str(value)) throw Err.std(`R2 custom metadata value must be a string: ${name}`);
    custom[name] = value;
  }
  return Obj.keys(custom).length > 0 ? Object.freeze(custom) : undefined;
}

function toPrefix(input: string): string {
  if (!Is.str(input)) throw Err.std(`R2 list prefix must be a string.`);
  if (Str.trimLeadingSlashes(input) !== input || Str.trimLeadingDotSlash(input) !== input) {
    throw Err.std(`R2 list prefix must be rootless: ${input}`);
  }
  return input;
}

function toNonNegativeInteger(input: number, label: string): number {
  if (!Num.Is.int(input) || input < 0) {
    throw Err.std(`R2 ${label} must be a finite non-negative integer.`);
  }
  return input;
}
