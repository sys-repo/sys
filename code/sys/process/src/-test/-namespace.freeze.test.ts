import { describe, expect, it } from '../-test/mod.ts';
import { Open } from '../m.open/mod.ts';
import { Process } from '../m.process/mod.ts';

describe('process namespace freeze contract', () => {
  it('freezes every exported namespace API and capability namespace', () => {
    const namespaces = [
      Open,
      Process,
      Process.Signal,
      Process.Script,
      Process.stdout,
      Process.Port,
      Process.Terminate,
    ];
    for (const namespace of namespaces) expect(Object.isFrozen(namespace)).to.eql(true);
  });
});
