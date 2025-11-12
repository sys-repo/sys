import { describe, expect, it } from '../../-test.ts';
import { CrdtWorker } from '../mod.ts';
import { attach } from '../u.repo.attach.ts';
import { createRepo } from '../u.repo.create.ts';
import { spawn } from '../u.spawn.ts';

describe(`CRDT: web-worker transport`, () => {
  it('API', async () => {
    expect(CrdtWorker.repo).to.equal(createRepo);
    expect(CrdtWorker.attach).to.equal(attach);
    expect(CrdtWorker.spawn).to.equal(spawn);
  });
});
