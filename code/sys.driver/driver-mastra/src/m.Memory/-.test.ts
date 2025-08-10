import { Memory as MastraMemory } from '@mastra/memory';
import { Crdt } from '@sys/driver-automerge/fs';
import { beforeEach, c, describe, expect, it, slug } from '../-test.ts';

import { type t } from './common.ts';
import { Memory } from './m.Memory.ts';

describe('Memory.Storage', { sanitizeResources: false, sanitizeOps: false }, () => {
  describe('Memory: utils', () => {
    describe('Memory.textOf', () => {
      const { textOf } = Memory;

      it('string → same string', () => {
        expect(textOf('hello')).to.eql('hello');
      });

      it('object: { text } → text', () => {
        expect(textOf({ text: 'hello' })).to.eql('hello');
      });

      it('object: { content } → content', () => {
        expect(textOf({ content: 'hello' })).to.eql('hello');
      });

      it('object: { parts: [...] } → concatenated', () => {
        const input = { parts: ['hello', { text: ' ' }, { content: 'world' }] };
        expect(textOf(input)).to.eql('hello world');
      });

      it('array: [mixed] → concatenated', () => {
        const input = ['a', { text: 'b' }, { content: 'c' }, { parts: ['d', { text: 'e' }] }];
        expect(textOf(input)).to.eql('abcde');
      });

      it('nested parts/arrays → flattened & concatenated', () => {
        const input = {
          parts: ['A', { parts: [{ text: 'B' }, { content: 'C' }] }, [{ text: 'D' }, 'E']],
        };
        expect(textOf(input)).to.eql('ABCDE');
      });

      it('empty/unknown shapes → empty string', () => {
        expect(textOf(undefined)).to.eql('');
        expect(textOf(null)).to.eql('');
        expect(textOf({})).to.eql('');
        expect(textOf({ parts: [] })).to.eql('');
        expect(textOf(123 as unknown)).to.eql('');
        expect(textOf(true as unknown)).to.eql('');
      });
    });
  });

  describe('Storage.crdt', () => {
    let doc: t.Crdt.Ref<t.MastraStorageDoc>;
    let storage: t.MastraStorage;
    let memory: InstanceType<typeof MastraMemory>;

    const setup = () => {
      const repo = Crdt.repo();
      const doc = repo.create<t.MastraStorageDoc>({ threads: {}, messages: {}, resources: {} });
      const storage = Memory.Storage.crdt({ doc });
      const memory = new MastraMemory({ storage, options: { semanticRecall: false } });
      return { repo, doc, storage, memory } as const;
    };

    beforeEach(async () => {
      ({ doc, storage, memory } = setup());
      await storage.init();
    });

    describe('lifecycle/init', () => {
      it('initializes empty maps on first run', () => {
        const d = doc.current;
        expect(d.threads).to.eql({});
        expect(d.messages).to.eql({});
        expect(d.resources).to.eql({});
      });

      it('is idempotent on repeated init() calls', async () => {
        await storage.init();
        await storage.init();
        const d = doc.current;
        expect(Object.keys(d)).to.have.members(['threads', 'messages', 'resources']);
      });
    });

    describe('methods and states', () => {
      describe('supports flags', () => {
        it('advertises expected capabilities', () => {
          expect((storage as any).supports).to.include({
            selectByIncludeResourceScope: true,
            resourceWorkingMemory: true,
            deleteMessages: true,
            hasColumn: false,
            createTable: false,
          });
        });
      });

      describe('threads: create/update/delete', () => {
        it('saveThread(new) creates row, messages[], and sets ISO timestamps in CRDT', async () => {
          const t1 = await mkThread(storage, { resourceId: 'rX', title: 'A' });
          const row = doc.current.threads[t1.id];
          expect(typeof row.createdAt).to.eql('string');
          expect(typeof row.updatedAt).to.eql('string');
          expect(doc.current.messages[t1.id]).to.eql([]);
        });

        it('saveThread(existing) delegates to updateThread; preserves metadata unless provided', async () => {
          const t1 = await mkThread(storage, { resourceId: 'r', title: 'A', metadata: { a: 1 } });
          const rowBefore = doc.current.threads[t1.id];
          const updated = await storage.saveThread({
            thread: {
              id: t1.id,
              resourceId: 'r',
              title: 'B',
              createdAt: new Date(),
              updatedAt: new Date(),
            } as t.StorageThreadType,
          });
          const rowAfter = doc.current.threads[t1.id];
          expect(updated.title).to.eql('B');
          expect(rowAfter.metadata).to.eql(rowBefore.metadata);
        });

        it('updateThread: set and delete metadata; updatedAt bumps', async () => {
          const t1 = await mkThread(storage, { resourceId: 'r' });
          const before = doc.current.threads[t1.id].updatedAt;
          await sleep(5);
          await storage.updateThread({ id: t1.id, title: 'Z', metadata: { x: 1 } });
          const withMeta = doc.current.threads[t1.id];
          expect(withMeta.metadata).to.eql(JSON.stringify({ x: 1 }));
          const midUpdatedAt = withMeta.updatedAt;
          expect(midUpdatedAt > before).to.eql(true);
          await sleep(5);
          await (storage as any).updateThread({ id: t1.id, title: 'Z', metadata: undefined });
          const after = doc.current.threads[t1.id];
          expect('metadata' in after).to.eql(false);
          expect(after.updatedAt > midUpdatedAt).to.eql(true);
        });

        it('deleteThread removes row + messages and is safe if non-existent', async () => {
          const t1 = await mkThread(storage, { resourceId: 'r' });
          await storage.saveMessages({ format: 'v2', messages: [msg({ threadId: t1.id })] });
          await storage.deleteThread({ threadId: t1.id });
          expect(doc.current.threads[t1.id]).to.eql(undefined);
          expect(doc.current.messages[t1.id]).to.eql(undefined);
          await storage.deleteThread({ threadId: 'nope' }); // no throw
        });

        it('getThreadById maps ISO→Date and omits metadata on Mastra thread type', async () => {
          const t1 = await mkThread(storage, { resourceId: 'r', metadata: { k: 1 } });
          const fetched = await storage.getThreadById({ threadId: t1.id });
          expect(fetched?.createdAt instanceof Date).to.eql(true);
          expect(fetched?.updatedAt instanceof Date).to.eql(true);
          expect((fetched as any).metadata).to.eql(undefined);
        });
      });

      describe('threads: listing, sort, pagination', () => {
        it('getThreadsByResourceId filters by resourceId only and sorts DESC by default', async () => {
          const a = await mkThread(storage, { resourceId: 'R1', title: 'A' });
          await sleep(5);
          const b = await mkThread(storage, { resourceId: 'R1', title: 'B' });
          const c = await mkThread(storage, { resourceId: 'R2', title: 'C' });
          const rows = await storage.getThreadsByResourceId({ resourceId: 'R1' });
          expect(rows.map((t) => t.id)).to.eql([b.id, a.id]); // DESC by createdAt
          expect(rows.find((t) => t.id === c.id)).to.eql(undefined);
        });

        it('pagination slices and reports hasMore; clamps negatives and zero perPage', async () => {
          for (let i = 0; i < 7; i++) await mkThread(storage, { resourceId: 'P' });
          const page0 = await storage.getThreadsByResourceIdPaginated({
            resourceId: 'P',
            page: -5,
            perPage: 0,
          });
          expect(page0.page).to.eql(-5);
          expect(page0.perPage).to.eql(0);
          expect(page0.threads.length).to.eql(0);

          const page1 = await storage.getThreadsByResourceIdPaginated({
            resourceId: 'P',
            page: 1,
            perPage: 3,
          });
          expect(page1.threads.length).to.eql(3);
          expect(page1.hasMore).to.eql(true);

          const last = await storage.getThreadsByResourceIdPaginated({
            resourceId: 'P',
            page: 2,
            perPage: 3,
          });
          expect(last.threads.length).to.eql(1);
          expect(last.hasMore).to.eql(false);
        });
      });

      describe('messages (v2): save/get/aggregate', () => {
        it('saveMessages appends and bumps thread.updatedAt', async () => {
          const t1 = await mkThread(storage, { resourceId: 'r' });
          const before = doc.current.threads[t1.id].updatedAt;
          await sleep(5);
          await storage.saveMessages({
            format: 'v2',
            messages: [msg({ threadId: t1.id })],
          });
          const after = doc.current.threads[t1.id].updatedAt;
          expect(after > before).to.eql(true);
          expect(doc.current.messages[t1.id].length).to.eql(1);
        });

        it('saveMessages infers threadId from first message when not provided', async () => {
          const t1 = await mkThread(storage, { resourceId: 'r' });
          await storage.saveMessages({ format: 'v2', messages: [msg({ threadId: t1.id })] });
          expect(doc.current.messages[t1.id].length).to.eql(1);
        });

        it('saveMessages to unknown thread creates message bucket but not a thread row', async () => {
          const tid = 'ghost-' + uuid();
          await storage.saveMessages({ format: 'v2', messages: [msg({ threadId: tid })] });
          expect(doc.current.messages[tid]?.length).to.eql(1);
          expect(doc.current.threads[tid]).to.eql(undefined);
        });

        it('getMessages(threadId) returns messages sorted by createdAt', async () => {
          const t1 = await mkThread(storage, { resourceId: 'r' });
          const m1 = msg({ threadId: t1.id, createdAt: new Date('2025-01-01T00:00:01.000Z') });
          const m2 = msg({ threadId: t1.id, createdAt: '2025-01-01T00:00:00.500Z' });
          const m3 = msg({ threadId: t1.id, createdAt: new Date('2025-01-01T00:00:02.000Z') });
          await storage.saveMessages({ format: 'v2', messages: [m1, m2, m3] });
          const list = await storage.getMessages({
            format: 'v2',
            threadId: t1.id,
            selectBy: {} as any,
          });
          expect(list.map((x) => x.id)).to.eql([m2.id, m1.id, m3.id]);
        });

        it('resource aggregation: { resourceId } only; sorts by createdAt', async () => {
          const tA = await mkThread(storage, { resourceId: 'R', title: 'A' });
          const tB = await mkThread(storage, { resourceId: 'R', title: 'B' });
          const A1 = msg({ threadId: tA.id, createdAt: '2025-01-02T00:00:00.000Z' });
          const B1 = msg({ threadId: tB.id, createdAt: '2025-01-01T00:00:00.000Z' });
          await storage.saveMessages({ format: 'v2', messages: [A1] });
          await storage.saveMessages({ format: 'v2', messages: [B1] });
          const agg = await (storage as any).getMessages({
            format: 'v2',
            resourceId: 'R',
            selectBy: {} as any,
          });
          expect(agg.map((x: t.MastraMessageV2) => x.id)).to.eql([B1.id, A1.id]);
        });

        it('selectBy.last: last=2 returns last two; last=0 returns full list (locked)', async () => {
          const t1 = await mkThread(storage, { resourceId: 'r' });
          const items = [0, 1, 2, 3, 4].map((i) =>
            msg({ threadId: t1.id, createdAt: new Date(1700000000000 + i) }),
          );
          await storage.saveMessages({ format: 'v2', messages: items });
          const last2 = await storage.getMessages({
            format: 'v2',
            threadId: t1.id,
            selectBy: { last: 2 } as any,
          });
          expect(last2.length).to.eql(2);
          expect(last2.map((m) => m.id)).to.eql([items[3].id, items[4].id]);

          const last0 = await storage.getMessages({
            format: 'v2',
            threadId: t1.id,
            selectBy: { last: 0 } as any,
          });
          expect(last0.length).to.eql(5); // slice(-0) → full list
        });

        it('returned arrays are copies (mutating result does not alter CRDT state)', async () => {
          const t1 = await mkThread(storage, { resourceId: 'r' });
          const items = [msg({ threadId: t1.id }), msg({ threadId: t1.id })];
          await storage.saveMessages({ format: 'v2', messages: items });
          const list = await storage.getMessages({
            format: 'v2',
            threadId: t1.id,
            selectBy: {} as any,
          });
          list.pop();
          const list2 = await storage.getMessages({
            format: 'v2',
            threadId: t1.id,
            selectBy: {} as any,
          });
          expect(list2.length).to.eql(2);
        });
      });

      describe('messages: delete', () => {
        it('deleteMessages removes across multiple threads and bumps updatedAt only for changed threads', async () => {
          const tA = await mkThread(storage, { resourceId: 'R' });
          const tB = await mkThread(storage, { resourceId: 'R' });
          const A1 = msg({ threadId: tA.id });
          const A2 = msg({ threadId: tA.id });
          const B1 = msg({ threadId: tB.id });
          await storage.saveMessages({ format: 'v2', messages: [A1, A2] });
          await storage.saveMessages({ format: 'v2', messages: [B1] });

          const beforeA = doc.current.threads[tA.id].updatedAt;
          const beforeB = doc.current.threads[tB.id].updatedAt;
          await sleep(5);

          await storage.deleteMessages([A2.id]);
          expect(doc.current.messages[tA.id].map((m) => m.id)).to.eql([A1.id]);
          expect(doc.current.messages[tB.id].map((m) => m.id)).to.eql([B1.id]);

          const afterA = doc.current.threads[tA.id].updatedAt;
          const afterB = doc.current.threads[tB.id].updatedAt;
          expect(afterA > beforeA).to.eql(true);
          expect(afterB).to.eql(beforeB);
        });

        it('deleteMessages([]) is a no-op', async () => {
          await storage.deleteMessages([]);
        });
      });

      describe('working memory (resource state)', () => {
        it('getResourceWorkingMemory → null when absent', async () => {
          const v = await (storage as any).getResourceWorkingMemory({ resourceId: 'X' });
          expect(v).to.eql(null);
        });

        it('setResourceWorkingMemory creates/updates and stamps updatedAt', async () => {
          await (storage as any).setResourceWorkingMemory({
            resourceId: 'X',
            workingMemory: '# notes',
          });
          const first = doc.current.resources['X'];
          expect(first?.workingMemory).to.eql('# notes');
          const before = first?.updatedAt as string;
          await sleep(5);
          await (storage as any).setResourceWorkingMemory({
            resourceId: 'X',
            workingMemory: '# notes 2',
          });
          const after = doc.current.resources['X'];
          expect(after?.workingMemory).to.eql('# notes 2');
          expect((after?.updatedAt as string) > before).to.eql(true);
        });
      });

      describe('mapping & integrity', () => {
        it('CRDT row keeps timestamps as ISO strings; getThreadById maps to Date', async () => {
          const t1 = await mkThread(storage, { resourceId: 'r' });
          const row = doc.current.threads[t1.id];
          expect(typeof row.createdAt).to.eql('string');
          expect(typeof row.updatedAt).to.eql('string');
          const fetched = await storage.getThreadById({ threadId: t1.id });
          expect(fetched?.createdAt instanceof Date).to.eql(true);
          expect(fetched?.updatedAt instanceof Date).to.eql(true);
        });

        it('never writes undefined into CRDT (metadata key removed when not present)', async () => {
          const t1 = await mkThread(storage, { resourceId: 'r', metadata: { a: 1 } });
          await (storage as any).updateThread({ id: t1.id, title: 'T', metadata: undefined });
          const row = doc.current.threads[t1.id];
          expect('metadata' in row).to.eql(false);
        });
      });

      describe('sequence/recency semantics', () => {
        it('updatedAt ordering reflects most recent thread change', async () => {
          const tA = await mkThread(storage, { resourceId: 'R' });
          await sleep(5);
          const tB = await mkThread(storage, { resourceId: 'R' });
          await sleep(5);
          await storage.saveMessages({ format: 'v2', messages: [msg({ threadId: tA.id })] });
          await sleep(5);
          await storage.saveMessages({ format: 'v2', messages: [msg({ threadId: tB.id })] });
          const list = await storage.getThreadsByResourceId({
            resourceId: 'R',
            orderBy: 'updatedAt',
            sortDirection: 'DESC',
          });
          expect(list[0].id).to.eql(tB.id);
        });
      });

      describe('edge & resilience', () => {
        it('getMessages for unknown threadId returns []', async () => {
          const list = await storage.getMessages({
            format: 'v2',
            threadId: 'nope',
            selectBy: {} as any,
          });
          expect(list).to.deep.eql([]);
        });

        it('resource-scope aggregation ignores orphan message buckets with no thread row', async () => {
          const orphanTid = 'phantom-' + uuid();
          doc.change((d) => {
            d.messages[orphanTid] = [msg({ threadId: orphanTid })];
          });
          const agg = await (storage as any).getMessages({
            format: 'v2',
            resourceId: 'R-Z',
            selectBy: {} as any,
          });
          expect(agg).to.deep.eql([]);
        });
      });

      describe('light integration: MastraMemory on top of storage', () => {
        it('MastraMemory can persist via underlying storage (smoke)', async () => {
          const t1 = await mkThread(storage, { resourceId: 'M' });
          await memory.saveMessages({
            messages: [msg({ threadId: t1.id, content: 'hello from mastra' })],
            format: 'v2',
          });
          const list = await storage.getMessages({
            format: 'v2',
            threadId: t1.id,
            selectBy: {} as any,
          });
          expect(list.length).to.eql(1);

          // content can be a string or a structured object ({ format, parts, ... })
          const extractText = (c: unknown): string => {
            if (typeof c === 'string') return c;
            if (Array.isArray(c)) return c.map(extractText).join('');
            if (c && typeof c === 'object') {
              const anyC = c as any;
              if (Array.isArray(anyC.parts)) {
                return anyC.parts
                  .map((p: any) =>
                    typeof p === 'string'
                      ? p
                      : typeof p?.text === 'string'
                      ? p.text
                      : typeof p?.content === 'string'
                      ? p.content
                      : '',
                  )
                  .join('');
              }
              if (typeof anyC.text === 'string') return anyC.text;
            }
            return '';
          };

          const text = extractText((list[0] as any).content);
          expect(text).to.contain('hello from mastra');
        });
      });
    });

    describe('print:', () => {
      it('Storage', () => {
        const { storage } = setup();
        console.info();
        console.info(c.green(`API: Memory.Storage.${`crdt( ${c.cyan('doc')} ):`}`));
        console.info(c.cyan(`${c.bold('Adapter')}: MastraStorage:\n`), storage);
        console.info();
      });

      it('Memory/Doc: initial', () => {
        const { doc } = setup();
        console.info();
        console.info(c.green(`Memory/CRDT: initial (empty)`));
        console.info(c.cyan(c.bold('T:Crdt<MastraStorageDoc>:')), doc.current);
        console.info();
      });

      it('Memory/Doc: example state', async () => {
        const resourceId = 'res-' + slug();

        // 1: Resource working memory (via storage helper that we know works).
        await (storage as any).setResourceWorkingMemory({
          resourceId,
          workingMemory: 'Goals: concise replies; style: BDD + expect; ethos: local-first.',
        });

        // 2: One thread (canonical).
        const t1 = await mkThread(storage, { resourceId, title: 'Demo thread' });

        // 3: Two-turn exchange (persist via MastraMemory).
        await memory.saveMessages({
          format: 'v2',
          messages: [
            msg({
              threadId: t1.id,
              role: 'user',
              content: 'hello from the "Mastra" system driver',
            }),
            msg({
              threadId: t1.id,
              role: 'assistant',
              content: '👋 hi there — msg persisted via CRDT',
            }),
          ],
        });

        // 4: Assert canonical, compact final shape.
        const d = doc.current;
        expect(Object.keys(d.resources)).to.include(resourceId);
        expect(d.resources[resourceId].workingMemory).to.contain('Goals:');

        expect(Object.keys(d.threads)).to.include(t1.id);
        expect(d.threads[t1.id].resourceId).to.equal(resourceId);
        expect(d.threads[t1.id].title).to.equal('Demo thread');

        const msgs = d.messages[t1.id] ?? [];
        expect(msgs.length).to.equal(2);
        expect(msgs[0].role).to.equal('user');

        const msg0 = msgs[0];
        const msg1 = msgs[1];
        expect(Memory.textOf(msg0?.content)).to.contain('hello from the "Mastra" system driver');
        expect(Memory.textOf(msg1?.content)).to.contain('👋 hi there — msg persisted via CRDT');

        // 5: Print a concise, canonical snapshot.
        console.info();
        console.info(c.cyan(c.bold('T:Crdt<MastraStorageDoc>:')));
        console.info({
          resources: { [resourceId]: d.resources[resourceId] },
          threads: { [t1.id]: d.threads[t1.id] },
          messages: { [t1.id]: msgs },
        });
        console.info();
      });
    });
  });
});

/**
 * Helpers:
 */
const uuid = () => crypto.randomUUID();
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const msg = (p: {
  threadId: string;
  id?: string;
  role?: 'user' | 'assistant' | 'system' | 'tool';
  content?: string;
  createdAt?: Date | string;
}): t.MastraMessageV2 => {
  const { threadId, id = uuid(), role = 'user', content = 'x', createdAt = new Date() } = p;
  return {
    id,
    threadId,
    role,
    content,
    createdAt,
  } as unknown as t.MastraMessageV2;
};

// ThreadInit must satisfy Mastra's StorageThreadType (includes createdAt/updatedAt):
type S = Pick<t.StorageThreadType, 'id' | 'resourceId' | 'title' | 'createdAt' | 'updatedAt'>;
type ThreadInit = S & { metadata?: Record<string, unknown> };
const mkThread = async (storage: t.MastraStorage, p: Partial<ThreadInit> = {}) => {
  const now = new Date();
  const thread: ThreadInit = {
    id: p.id ?? uuid(),
    resourceId: p.resourceId ?? 'r1',
    title: p.title ?? 'Untitled',
    createdAt: p.createdAt ?? now,
    updatedAt: p.updatedAt ?? now,
    ...(p.metadata ? { metadata: p.metadata } : {}),
  };
  return storage.saveThread({ thread });
};
