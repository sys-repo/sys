import {
  clone,
  extra,
  PINNED_DEFLATE_SHA256,
  PINNED_DEFLATE_TEXT,
  pinnedDeflateBytes,
  setU16,
  setU32,
  zip,
} from './u.fixture.zip.ts';

/** ZIP byte construction and explicit record edits, independent of the production parser and runner. */
export const Fixture = Object.freeze({
  zip,
  extra,
  clone,
  setU16,
  setU32,
  deflate: Object.freeze({
    text: PINNED_DEFLATE_TEXT,
    sha256: PINNED_DEFLATE_SHA256,
    bytes: pinnedDeflateBytes,
  }),
});
