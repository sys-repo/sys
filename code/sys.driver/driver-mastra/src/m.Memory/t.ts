import type { MastraMessageV2 } from '@mastra/core/agent';
import type { t } from './common.ts';

export type { MastraStorage } from 'npm:@mastra/core/storage';

type Doc = t.MastraStorageDoc;
type DocRef = t.Crdt.Ref<Doc>;

/**
 * API for memory/storage related tools.
 */
export type MastraMemoryLib = Readonly<{
  Storage: t.MastraStorageLib;
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
  metadata?: string; // consider t.JsonValue if this will be structured JSON
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
