export type { MastraStorage } from '@mastra/core/storage';
import type { MastraMessageV2 } from '@mastra/core/agent';
import type { t } from './common.ts';

type Doc = t.MastraStorageDoc;
type DocRef = t.Crdt.Ref<Doc>;

/**
 * API for memory/storage related tools.
 */
export type MastraMemoryLib = Readonly<{
  Storage: t.MastraStorageLib;

  /**
   * Extracts plain text from a Mastra `content` field or similar structured value.
   *
   * Mastra's v2 message format stores message `content` as either:
   *   - A simple string.
   *   - An array of strings and/or nested content objects.
   *   - An object containing a `parts` array, where each part may itself
   *     be a string or an object with `text` or `content` properties.
   *
   * This utility recursively traverses any of these shapes and concatenates
   * all textual fragments into a single string.
   *
   * Examples:
   * ```ts
   * textOf("hello");                                   // → "hello"
   * textOf({ text: "hello" });                         // → "hello"
   * textOf({ content: "hello" });                      // → "hello"
   * textOf({ parts: ["hello", { text: " world" }] });  // → "hello world"
   * textOf([{ text: "foo" }, { content: "bar" }]);     // → "foobar"
   * ```
   *
   * @param c - The value to extract text from. May be a string, array, or object.
   * @returns The concatenated plain-text content, or an empty string if none found.
   */
  textOf(c: unknown): string;
}>;

/**
 * API for CRDT/Automerge backed memory stores.
 */
export type MastraStorageLib = Readonly<{
  crdt(args: { doc: DocRef }): t.MastraStorage;
}>;

/**
 * A single thread row stored in the CRDT.
 * Uses ISO timestamps; `metadata` is a stringified JSON blob (if present).
 */
export type MastraThread = {
  id: t.StringId;
  resourceId: string;
  title: string;
  metadata?: string;
  createdAt: t.StringIsoDate;
  updatedAt: t.StringIsoDate;
};

/**
 * The root CRDT document for the storage adapter.
 * Maps: threadId → thread, threadId → V2 messages[], resourceId → resource state.
 */
export type MastraStorageDoc = {
  threads: Record<string, MastraThread>;
  messages: Record<string, MastraMessageV2[]>;
  resources: Record<string, t.MastraStorageResource>;
};

/**
 * Per-resource working state.
 * `workingMemory` is free-form markdown; `metadata` is arbitrary; `updatedAt` is ISO.
 */
export type MastraStorageResource = {
  workingMemory?: t.StringMarkdown;
  metadata?: unknown;
  updatedAt?: t.StringIsoDate;
};
