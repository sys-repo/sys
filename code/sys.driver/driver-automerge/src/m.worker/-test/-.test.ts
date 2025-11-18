import { describe, expect, it } from '../../-test.ts';
import { WIRE_VERSION } from '../common.ts';
import { CrdtWorker } from '../mod.ts';
import { attachRepo } from '../u.attach.repo.ts';
import { createRepo } from '../u.proxy.repo.ts';
import { spawn } from '../u.spawn.ts';

describe(`CRDT: web-worker transport`, () => {
  it('API', async () => {
    expect(CrdtWorker.repo).to.equal(createRepo);
    expect(CrdtWorker.attach).to.equal(attachRepo);
    expect(CrdtWorker.spawn).to.equal(spawn);
    expect(CrdtWorker.version).to.eql(WIRE_VERSION);
  });
});
