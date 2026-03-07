import { afterAll, beforeAll, describe, expect, it, makeWorkerFixture } from '../../-test.ts';
import { type t, A, slug } from '../common.ts';
import { CrdtCmd } from './u.ts';

import { Hash } from '@sys/crypto/hash';
import { Fs } from '@sys/fs';

describe('Command: "doc:save"', () => {
  let env: t.TestWorkerFixture;
  beforeAll(async () => void (env = await makeWorkerFixture()));
  afterAll(() => env?.dispose());

  it('save to CRDT to a folder (happy path)', async () => {
    type D = { foo: string };
    const initial: D = { foo: slug() };
    const path = `.tmp/test/Crdt.Cmd.save/${slug()}`;

    // 1. Create a doc inside the worker-backed repo.
    const create = await env.repo.create<D>(initial);
    if (!create.ok) throw new Error(`create failed: ${create.error.message}`);
    const doc = create.doc;

    // 2. Command client over the same MessagePort as the repo.
    const cmd = CrdtCmd.make();
    const client = cmd.client(env.port);

    // 3. Save.
    const res = await client.send('doc:save', { doc: doc.id, path });
    const file = await Fs.read(Fs.resolve(res.path));
    expect(file.data?.byteLength).to.eql(res.bytes);
    expect(Hash.sha256(file.data)).to.eql(res.hash);

    // 4. Verify saved CRDT.
    const am = A.load<D>(file.data!);
    expect(am).to.eql(initial);
    expect(am).to.eql(doc.current);
  });
});
