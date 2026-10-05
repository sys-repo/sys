import { describe, expect, it } from '../-test.ts';
import { Net } from '../mod.ts';
import { Host } from '../m.Net/u.host.ts';

describe('net namespace freeze contract', () => {
  it('freezes every exported namespace API and nested namespace', () => {
    const namespaces = [Net, Net.Port, Host, Host.ipv4, Host.ipv6];
    for (const namespace of namespaces) expect(Object.isFrozen(namespace)).to.eql(true);
  });
});
