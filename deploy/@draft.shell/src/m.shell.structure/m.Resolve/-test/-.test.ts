import { describe, expect, it } from '../../../-test.ts';
import { resolve } from '../mod.ts';

describe('ShellStructure.Resolve', () => {
  it('resolves the minimal ShellStructure.Structure root', () => {
    const structure = { kind: 'shell.structure', version: 1, name: 'Sample Shell' } as const;
    const resolved = resolve(structure);

    expect(resolved).to.eql(structure);
  });
});
