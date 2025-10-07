import type { t } from './common.ts';

import type { MastraMessageV2 } from '@mastra/core/agent';
import type { StorageThreadType } from '@mastra/core/memory';
import type { StorageGetMessagesArg } from '@mastra/core/storage';

type O = Record<string, unknown>;
type Doc = t.MastraStorageDoc;
type DocRef = t.Crdt.Ref<Doc>;
type GetV2Args = StorageGetMessagesArg & { format: 'v2' };
type SaveV2Args =
  | { messages: MastraMessageV2[]; format: 'v2' }
  | { messages: MastraMessageV2[]; format: 'v2'; threadId: string };

export const create = (args: { doc: DocRef }): t.MastraStorage => {
  const { doc } = args;
  const read = <R>(fn: (d: Doc) => R): R => fn(doc.current);
  const mutate = (fn: (d: Doc) => void) => void doc.change(fn);

  /**
   * Capabilities advertised to Mastra:
   */
  const supports = {
    selectByIncludeResourceScope: true,
    resourceWorkingMemory: true,
    hasColumn: false,
    createTable: false,
    deleteMessages: true,
  };

  /**
   * Lifecycle:
   */
  const init = async () => {
    mutate((d) => {
      d.threads ??= {} as Doc['threads'];
      d.messages ??= {} as Doc['messages'];
      d.resources ??= {} as Doc['resources'];
    });
  };

  /**
   * Methods:
   */
  const saveThread = async (args: { thread: StorageThreadType }): Promise<StorageThreadType> => {
    const { thread } = args;
    const exists = read((d) => d.threads[thread.id]);
    if (exists) {
      return updateThread({
        id: thread.id,
        title: thread.title ?? 'Untitled',
        // NB: pass through only if defined on the incoming thread object
        ...(hasMetadata(thread) && thread.metadata !== undefined
          ? { metadata: thread.metadata }
          : {}),
      } as { id: string; title: string; metadata?: O });
    }

    // Compute optional metadata string:
    const rawMeta: O | undefined = hasMetadata(thread) ? thread.metadata : undefined;
    const metaStr: string | undefined = rawMeta === undefined ? undefined : JSON.stringify(rawMeta);

    // Omit key when undefined:
    const now = getTimestamp();
    const row: t.MastraThread = {
      id: thread.id as t.StringId,
      resourceId: thread.resourceId,
      title: thread.title ?? 'Untitled',
      createdAt: now,
      updatedAt: now,
      ...(metaStr !== undefined ? { metadata: metaStr } : {}),
    };

    mutate((d) => {
      d.threads[row.id] = row;
      d.messages[row.id] ??= [];
    });
    return toStorageThread(row);
  };

  const updateThread = async (args: {
    id: string;
    title: string;
    metadata?: O;
  }): Promise<StorageThreadType> => {
    const now = getTimestamp();
    mutate((d) => {
      const threadRow = d.threads[args.id];
      if (!threadRow) return;

      threadRow.title = args.title ?? 'Untitled';

      if ('metadata' in args) {
        if (args.metadata === undefined) {
          delete threadRow.metadata;
        } else {
          threadRow.metadata = JSON.stringify(args.metadata);
        }
      }

      threadRow.updatedAt = now;
    });
    const updated = read((d) => d.threads[args.id])!;
    return toStorageThread(updated);
  };

  const deleteThread = async ({ threadId }: { threadId: string }): Promise<void> => {
    mutate((d) => {
      delete d.threads[threadId];
      delete d.messages[threadId];
    });
  };

  const getThreadById = async ({
    threadId,
  }: {
    threadId: string;
  }): Promise<StorageThreadType | null> => {
    const row = read((d) => d.threads[threadId] ?? null);
    return row ? toStorageThread(row) : null;
  };

  const getThreadsByResourceId = async (args: {
    resourceId: string;
    orderBy?: 'createdAt' | 'updatedAt';
    sortDirection?: 'ASC' | 'DESC';
  }): Promise<StorageThreadType[]> => {
    const { resourceId, orderBy = 'createdAt', sortDirection = 'DESC' } = args;
    const rows = read((d) => Object.values(d.threads).filter((t) => t.resourceId === resourceId));
    const sorted = rows.sort((a, b) => {
      const cmp = a[orderBy].localeCompare(b[orderBy]);
      return sortDirection === 'ASC' ? cmp : -cmp;
    });
    return sorted.map(toStorageThread);
  };

  const getThreadsByResourceIdPaginated = async (args: {
    resourceId: string;
    page: number;
    perPage: number;
    orderBy?: 'createdAt' | 'updatedAt';
    sortDirection?: 'ASC' | 'DESC';
  }): Promise<{
    threads: StorageThreadType[];
    total: number;
    page: number;
    perPage: number;
    hasMore: boolean;
  }> => {
    const { resourceId, page, perPage, orderBy = 'createdAt', sortDirection = 'DESC' } = args;
    const all = await getThreadsByResourceId({ resourceId, orderBy, sortDirection });
    const total = all.length;
    const start = Math.max(0, page) * Math.max(0, perPage); // perPage=0 → 0 items
    const threads = all.slice(start, start + perPage);
    const hasMore = start + perPage < total;
    return { threads, total, page, perPage, hasMore };
  };

  const getMessages = async (args: GetV2Args): Promise<MastraMessageV2[]> => {
    const { threadId, resourceId, selectBy } = args;

    const toMs = (v: Date | string | undefined): number => {
      if (v instanceof Date) return v.getTime();
      if (typeof v === 'string') {
        const t = Date.parse(v);
        return Number.isFinite(t) ? t : 0;
      }
      return 0;
    };

    const sortByCreated = (arr: MastraMessageV2[]) =>
      arr.slice().sort((a, b) => toMs(a?.createdAt) - toMs(b?.createdAt));

    const list = read((d) => {
      /**
       * Resource-scope: if a resourceId is provided and no specific threadId,
       *                 aggregate messages across all threads for that resource.
       */
      if (resourceId && !threadId) {
        const tids = Object.values(d.threads)
          .filter((t) => t.resourceId === resourceId)
          .map((t) => t.id);
        const combined: MastraMessageV2[] = tids.flatMap((tid) => d.messages[tid] ?? []);
        return sortByCreated(combined);
      }
      const threadList: MastraMessageV2[] = d.messages[threadId ?? ''] ?? [];
      return sortByCreated(threadList);
    });

    const last = typeof selectBy?.last === 'number' ? selectBy.last : undefined;

    return typeof last === 'number' ? list.slice(-last) : list;
  };

  const saveMessages = async (args: SaveV2Args): Promise<MastraMessageV2[]> => {
    const msgs = args.messages ?? [];
    if (!msgs.length) return [];

    const threadId = 'threadId' in args ? args.threadId : msgs[0]?.threadId;
    if (!threadId) throw new Error('threadId is required on messages');

    const now = getTimestamp();

    mutate((d) => {
      d.messages[threadId] ??= [];
      for (const m of msgs) {
        const clean: O = {};
        for (const [k, v] of Object.entries(m as O)) {
          if (v !== undefined) clean[k] = v;
        }
        (d.messages[threadId] as unknown as any[]).push(clean as unknown as MastraMessageV2);
      }
      const trow = d.threads[threadId];
      if (trow) trow.updatedAt = now;
    });

    return msgs;
  };

  const deleteMessages = async (messageIds: string[]): Promise<void> => {
    if (!messageIds?.length) return;
    const idset = new Set(messageIds);
    const now = getTimestamp();
    mutate((d) => {
      for (const [tid, list] of Object.entries(d.messages)) {
        let changed = false;
        for (let i = (list as MastraMessageV2[]).length - 1; i >= 0; i--) {
          const m = (list as MastraMessageV2[])[i];
          if (idset.has(m.id)) {
            (list as MastraMessageV2[]).splice(i, 1);
            changed = true;
          }
        }
        if (changed) {
          const trow = d.threads[tid];
          if (trow) trow.updatedAt = now;
        }
      }
    });
  };

  /**
   * Working memory:
   */
  const getResourceWorkingMemory = async (args: { resourceId: string }): Promise<string | null> => {
    return read((d) => d.resources[args.resourceId]?.workingMemory ?? null);
  };

  const setResourceWorkingMemory = async (args: {
    resourceId: string;
    workingMemory: string;
  }): Promise<void> => {
    const now = getTimestamp();
    mutate((d) => {
      d.resources[args.resourceId] ??= {};
      d.resources[args.resourceId].workingMemory = args.workingMemory;
      d.resources[args.resourceId].updatedAt = now;
    });
  };

  /**
   * Public API — asserted once to satisfy Memory’s ctor type.
   */
  const api = {
    supports,
    init,
    saveThread,
    updateThread,
    deleteThread,
    getThreadById,
    getThreadsByResourceId,
    getThreadsByResourceIdPaginated,
    getMessages, //  ← v2 only
    saveMessages, // ← v2 only
    deleteMessages,
    getResourceWorkingMemory,
    setResourceWorkingMemory,
  };

  return api as unknown as t.MastraStorage;
};

/**
 * Helpers:
 */
const getTimestamp = (): t.StringIsoDate => new Date().toISOString();
const hasMetadata = (x: unknown): x is { metadata?: O } => {
  return typeof x === 'object' && x !== null && 'metadata' in x;
};

/**
 * Thread mapping (CRDT row uses ISO strings; Mastra expects Date objects):
 */
const toStorageThread = (row: t.MastraThread): StorageThreadType => {
  return {
    id: row.id,
    resourceId: row.resourceId,
    title: row.title ?? 'Untitled',
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
  } as StorageThreadType;
};
