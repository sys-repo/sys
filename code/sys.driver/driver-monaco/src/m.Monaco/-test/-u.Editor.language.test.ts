import { describe, expect, it, MonacoFake } from '../../-test.ts';
import { Util } from '../u.ts';

describe('Monaco.Util.Editor.language', () => {
  it('returns plaintext for a plaintext model', () => {
    const model = MonacoFake.model('hello', { language: 'plaintext' });
    const editor = MonacoFake.editor(model);
    expect(Util.Editor.language(editor)).to.eql('plaintext');
  });

  it('falls back to UNKNOWN for unsupported language id', () => {
    const model = MonacoFake.model('hello');
    const editor = MonacoFake.editor(model);
    (model as unknown as { __setLanguageId(next: string): void }).__setLanguageId('not-supported');
    expect(Util.Editor.language(editor)).to.eql('UNKNOWN');
  });
});
