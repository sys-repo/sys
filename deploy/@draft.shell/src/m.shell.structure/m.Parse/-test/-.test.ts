import { describe, expect, it, Str } from '../../../-test.ts';
import { parse } from '../mod.ts';

describe('ShellStructure.Parse', () => {
  it('parses the minimal ShellStructure.Structure root', () => {
    const yaml = Str.dedent(`
      kind: shell.structure
      version: 1
      name: Sample Shell
    `);
    const structure = parse(yaml);
    expect(structure).to.eql({ kind: 'shell.structure', version: 1, name: 'Sample Shell' });
  });

  it('rejects invalid Shell.Structure input at the schema seam', () => {
    expect(() => parse({ kind: 'shell.structure' })).to.throw(
      /ShellStructure\.parse: invalid Shell\.Structure: .*\/version/,
    );
  });
});
