import { describe, expect, it } from '../../-test.ts';

import { CMD_VERSION } from '../common.ts';
import { CrdtWorkerCmd } from '../mod.ts';
import { attach } from '../u.host.attach.ts';
import { listen } from '../u.host.listen.ts';
import { createRepo } from '../u.client.repo.ts';
import { spawn } from '../u.client.spawn.ts';
import { make } from '../u.make.ts';

describe(`Crdt.WorkerCmd (Cmd-based worker transport)`, () => {
  it('API', async () => {
    expect(CrdtWorkerCmd.version).to.equal(CMD_VERSION);
    expect(CrdtWorkerCmd.make).to.equal(make);

    // Client:
    expect(CrdtWorkerCmd.Client.repo).to.equal(createRepo);
    expect(CrdtWorkerCmd.Client.spawn).to.equal(spawn);

    // Host:
    expect(CrdtWorkerCmd.Host.attach).to.equal(attach);
    expect(CrdtWorkerCmd.Host.listen).to.equal(listen);
  });

  it('make() returns a CmdFactory', () => {
    const cmd = CrdtWorkerCmd.make();
    expect(typeof cmd.client).to.equal('function');
    expect(typeof cmd.host).to.equal('function');
  });

  it('exported from Crdt.WorkerCmd', async () => {
    const m = await import('@sys/driver-automerge/fs');
    expect(m.Crdt.WorkerCmd).to.equal(CrdtWorkerCmd);
  });
});
