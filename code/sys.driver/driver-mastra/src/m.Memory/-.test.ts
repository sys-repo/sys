import { type t, c, describe, expect, it } from '../-test.ts';

import type { MastraMessageV2 } from '@mastra/core/agent';
import { Memory as MastraMemory } from '@mastra/memory';
import { Crdt } from '@sys/driver-automerge/fs';
import { create } from './m.Storage.crdt.ts';
import { Memory } from './mod.ts';

describe('Memory', { sanitizeResources: false, sanitizeOps: false }, () => {
  it('API', () => {
    expect(Memory.Storage.crdt).to.equal(create);
  });

  describe('CRDT', () => {
    const setup = () => {
      const repo = Crdt.repo();
      const doc = repo.create<t.MastraStorageDoc>({ threads: {}, messages: {}, resources: {} });
      const storage = Memory.Storage.crdt({ doc });
      const memory = new MastraMemory({ storage, options: { semanticRecall: false } });
      return { repo, doc, storage, memory } as const;
    };

    it('writes/reads V2 messages via Memory into CRDT', async () => {
      const { doc, memory } = setup();

      /**
       * 1. Create a thread via Memory (exercises saveThread path):
       */
      const thread = await memory.createThread({
        resourceId: 'user_1',
        title: 'Test Thread',
      });

      expect(thread.id).to.be.a('string');
      expect(doc.current.threads[thread.id]).to.exist; // CRDT mutated.

      const m1: MastraMessageV2 = {
        id: crypto.randomUUID(),
        threadId: thread.id,
        role: 'user',
        createdAt: new Date(),
        content: { format: 2, parts: [{ type: 'text', text: 'hello' }] },
      };

      const m2: MastraMessageV2 = {
        id: crypto.randomUUID(),
        threadId: thread.id,
        role: 'assistant',
        createdAt: new Date(Date.now() + 1),
        content: { format: 2, parts: [{ type: 'text', text: 'hi!' }] },
      };
      await memory.saveMessages({ messages: [m1, m2], format: 'v2' });

      // Verify CRDT actually holds two V2-canonical messages for that thread.
      expect(doc.current.messages[thread.id]?.length).to.equal(2);

      /**
       * 3. Read back via storage in V2 format.
       *    NB: Avoids any defaults that might assume V1:
       */
      const got = await memory.storage.getMessages({
        threadId: thread.id,
        format: 'v2',
      });

      expect(got.length).to.equal(2);
      const pickText = (msg: MastraMessageV2) =>
        (msg.content as any).parts.find((p: any) => p.type === 'text')?.text;

      expect(pickText(got[0])).to.equal('hello');
      expect(pickText(got[1])).to.equal('hi!');

      /**
       * 4. UpdatedAt bumped on thread write:
       */
      const stored = doc.current.threads[thread.id]!;
      const createdAtMs = new Date(stored.createdAt).getTime();
      const updatedAtMs = new Date(stored.updatedAt).getTime();
      expect(updatedAtMs).to.be.at.least(createdAtMs);

      // Finish up.
      console.info(c.cyan(c.bold(`Memory CRDT:\n`)), doc.current);
    });
  });
});
