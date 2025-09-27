/**
 * JSON (Javascript Object Notation).
 *  - https://www.json.org/json-en.html
 *  - https://devblogs.microsoft.com/typescript/announcing-typescript-3-7-beta
 */
export type Json = string | number | boolean | null | JsonMap | Json[];

/**
 * A JSON map {object}.
 */
export type JsonMap = { [property: string]: Json };

/**
 * A stringified JSON value.
 */
export type JsonString = string;

/**
 * An extended version of JSON that supports [undefined].
 */
export type JsonU = string | number | boolean | null | JsonMapU | JsonU[] | undefined;

/**
 * An extended version of JsonMap that supports [undefined].
 */
export type JsonMapU = { [property: string]: JsonU };

/**
 * CBOR (Concise Binary Object Representation)
 * RFC 8949
 * https://cbor.io
 */
export type CBOR = string | number | boolean | CBOR[] | { [key: string]: CBOR } | null;
