import { describe, expect, it } from '../../-test.ts';

import { WIRE_VERSION } from '../common.ts';
import { CrdtWorker } from '../mod.ts';
import { attachRepo } from '../u.host.attach.repo.ts';
import { listen } from '../u.host.listen.ts';
import { createRepo } from '../u.proxy.repo.ts';
import { spawn } from '../u.spawn.ts';

describe(`CRDT: web-worker transport`, () => {
  it('API', async () => {
    expect(CrdtWorker.version).to.eql(WIRE_VERSION);

    // Client:
    expect(CrdtWorker.Client.repo).to.equal(createRepo);
    expect(CrdtWorker.Client.spawn).to.equal(spawn);

    // Host:
    expect(CrdtWorker.Host.attach).to.equal(attachRepo);
    expect(CrdtWorker.Host.listen).to.equal(listen);
  });
});
