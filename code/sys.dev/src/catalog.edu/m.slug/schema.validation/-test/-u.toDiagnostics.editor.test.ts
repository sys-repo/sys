import { describe, expect, it } from '../../../-test.ts';
import { semanticErrorsToEditorDiagnostics } from '../mod.ts';

describe('schema.validation / semanticErrorsToEditorDiagnostics (Editor adapter)', () => {
  it('[] → []', () => {
    const out = semanticErrorsToEditorDiagnostics([]);
    expect(out).to.eql([]);
  });

  it('maps message/path and defaults severity → "Error"', () => {
    const errs = [{ kind: 'semantic', message: 'Duplicate alias', path: ['traits', 1, 'as'] }];
    const out = semanticErrorsToEditorDiagnostics(errs as any);

    expect(out.length).to.eql(1);
    expect(out[0]!.message).to.eql('Duplicate alias');
    expect(out[0]!.path).to.eql(['traits', 1, 'as']);
    expect(out[0]!.severity).to.eql('Error');
  });

  it('allows severity override', () => {
    const errs = [{ kind: 'semantic', message: 'Orphan props', path: ['props', 'x'] }];
    const out = semanticErrorsToEditorDiagnostics(errs as any, { severity: 'Warning' });
    expect(out[0]!.severity).to.eql('Warning');
  });
});
