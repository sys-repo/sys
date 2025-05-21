import { parseAutomergeUrl, stringifyAutomergeUrl } from '@automerge/automerge-repo';
import { Hash } from './libs.ts';
import { Is } from './u.Is.ts';

import type * as t from './t.ts';

type Shorten = number | [number, number];
type ShortenInput = Shorten | boolean;

/**
 * Helpers for working with document URIs.
 */
export const DocUri = {
  /**
   * Extract the ID component of a document URI.
   * eg: "automerge:<abc>" → "<abc>"
   */
  id(input: any, options: { shorten?: ShortenInput } = {}): string {
    if (Is.doc(input)) input = input.uri;
    if (typeof input !== 'string') return '';

    const done = (id: string) => {
      const shorten = wrangle.shorten(options.shorten);
      if (shorten) id = Hash.shorten(id, shorten);
      return id;
    };

    const text = input.trim();
    if (!text.includes(':')) return done(text);
    return done(text.split(':')[1] ?? '');
  },

  /**
   * Ensure the value is prefixed with "automerge:"
   */
  automerge(input: any, options: { shorten?: ShortenInput } = {}): string {
    const id = DocUri.id(input, options);
    return id ? `automerge:${id}` : '';
  },

  /**
   * Convenience method to extract a shortened ID from the URI.
   */
  shorten(input: any, shorten?: ShortenInput) {
    return DocUri.id(input, { shorten: shorten ?? true });
  },

  /**
   * Convert input to URI string.
   */
  toString(input?: t.Doc | string): string {
    if (!input) return '';
    if (typeof input === 'string') return input;
    if (Is.doc(input)) return input.uri;
    return '';
  },

  /**
   * Generate a new URI with a randomly generated document-id.
   */
  Generate: {
    uri() {
      const documentId = DocUri.Generate.docid.binary();
      return stringifyAutomergeUrl({ documentId });
    },
    docid: {
      binary() {
        // const uuid = crypto.randomUUID();
        // return v4(null, new Uint8Array(16)) as t.BinaryDocumentId;
        return wrangle.uuid() as t.BinaryDocumentId;
      },
      string() {
        const { documentId } = parseAutomergeUrl(DocUri.Generate.uri());
        return documentId;
      },
    },
  },
} as const;

/**
 * Helpers
 */
const wrangle = {
  shorten(shorten?: ShortenInput): Shorten | undefined {
    if (!shorten) return;
    if (shorten === true) return [4, 4];
    return shorten;
  },

  uuid() {
    // return v4(null, new Uint8Array(16)) as t.BinaryDocumentId;
    const uuidBytes = new Uint8Array(16); // Create a Uint8Array of 16 bytes
    crypto.getRandomValues(uuidBytes); // Fill the array with random bytes
    uuidBytes[6] = (uuidBytes[6] & 0x0f) | 0x40; // Set the version to 4 (UUID version 4)
    uuidBytes[8] = (uuidBytes[8] & 0x3f) | 0x80; // Set the variant to RFC 4122 (variant 1)
    return uuidBytes; // Return the Uint8Array
  },
} as const;
