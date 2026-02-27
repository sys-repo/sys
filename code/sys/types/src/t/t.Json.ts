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
 * A JSON-like value that is agnostic to readonly object/array input shapes.
 */
export type JsonLike = string | number | boolean | null | JsonMapLike | JsonLike[] | readonly JsonLike[];

/**
 * A JSON-like map {object} that accepts mutable or readonly index signatures.
 */
export type JsonMapLike = { [property: string]: JsonLike } | { readonly [property: string]: JsonLike };

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
 * A JSON-like value that supports [undefined] and readonly input shapes.
 */
export type JsonLikeU =
  | string
  | number
  | boolean
  | null
  | JsonMapLikeU
  | JsonLikeU[]
  | readonly JsonLikeU[]
  | undefined;

/**
 * A JSON-like map that supports [undefined] and mutable/readonly index signatures.
 */
export type JsonMapLikeU =
  | { [property: string]: JsonLikeU }
  | { readonly [property: string]: JsonLikeU };

/**
 * CBOR (Concise Binary Object Representation)
 * RFC 8949
 * https://cbor.io
 */
export type CBOR = string | number | boolean | CBOR[] | { [key: string]: CBOR } | null;
