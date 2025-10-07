import { describe, expect, it } from '../../-test.ts';
import { TextEditor } from './mod.ts';

describe('UI: Rich TextEditor', () => {
  it('API import', async () => {
    const m = await import('@sys/driver-prosemirror');
    expect(m.TextEditor).to.equal(TextEditor);
  });
});
