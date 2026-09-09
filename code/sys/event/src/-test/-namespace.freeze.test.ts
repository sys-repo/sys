import { describe, expect, it } from '../-test/mod.ts';
import { Cmd } from '../m.cmd/mod.ts';
import { CmdFixture } from '../m.cmd/testing/mod.ts';

describe('event namespace freeze contract', () => {
  it('freezes every exported namespace API and nested namespace', () => {
    const namespaces = [Cmd, Cmd.Is, Cmd.Transport, CmdFixture];
    for (const namespace of namespaces) expect(Object.isFrozen(namespace)).to.eql(true);
  });
});
