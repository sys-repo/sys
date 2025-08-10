import type { t } from './common.ts';
import type { MastraMessageV1 } from '@mastra/core';
import type { MastraMessageV2 } from '@mastra/core/agent';

export type { MastraStorage } from 'npm:@mastra/core/storage';

export type MastraThread = {
  id: t.StringId;
  resourceId: string;
  title: string;
  metadata?: string; // consider t.JsonValue if this will be structured JSON
  createdAt: t.StringIsoDate;
  updatedAt: t.StringIsoDate;
};

export type MastraStorageDoc = {
  threads: Record<string, MastraThread>;
  messages: Record<string, MastraMessageV2[]>;
  resources: Record<string, t.MastraStorageResource>;
};

export type MastraStorageResource = {
  workingMemory?: t.StringMarkdown;
  metadata?: unknown;
  updatedAt?: t.StringIsoDate;
};
