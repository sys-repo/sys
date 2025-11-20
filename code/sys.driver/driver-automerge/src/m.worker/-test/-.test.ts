import { describe, expect, it } from '../../-test.ts';

import { WIRE_VERSION } from '../common.ts';
import { CrdtWorker } from '../mod.ts';
import { attachRepo } from '../u.attach.repo.ts';
import { createRepo } from '../u.proxy.repo.ts';
import { spawn } from '../u.spawn.ts';

describe(`CRDT: web-worker transport`, () => {
  it('API', async () => {
    // Client:
    expect(CrdtWorker.Client.repo).to.equal(createRepo);
    expect(CrdtWorker.Client.spawn).to.equal(spawn);

    // Host:
    expect(CrdtWorker.attach).to.equal(attachRepo);
    expect(CrdtWorker.version).to.eql(WIRE_VERSION);
  });
});
