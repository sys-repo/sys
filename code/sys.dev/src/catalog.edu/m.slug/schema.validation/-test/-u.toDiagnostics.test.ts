import { describe, expect, it } from '../../../-test.ts';
import { semanticErrorsToDiagnostics } from '../mod.ts';

describe('schema.validation / semanticErrorsToDiagnostics (YAML adapter)', () => {
  it('[] → []', () => {
    const out = semanticErrorsToDiagnostics([]);
    expect(out).to.eql([]);
  });

  it('maps {message,path} and ignores other fields', () => {
    const errs = [
      { kind: 'semantic', message: 'Unknown trait', path: ['traits', 0, 'id'] },
      { kind: 'semantic', message: 'Missing props', path: ['props'] },
    ];
    const out = semanticErrorsToDiagnostics(errs as any);

    expect(out).to.eql([
      { message: 'Unknown trait', path: ['traits', 0, 'id'] },
      { message: 'Missing props', path: ['props'] },
    ]);

    // no accidental severity on YAML diagnostics
    expect('severity' in (out[0]! as any)).to.eql(false);
  });
});
