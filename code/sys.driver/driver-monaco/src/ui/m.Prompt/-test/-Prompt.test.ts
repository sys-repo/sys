import { describe, expect, it } from '../../../-test.ts';
import { EditorPrompt } from '../mod.ts';

describe('Monaco.Prompt', () => {
  it('API', async () => {
    const m = await import('@sys/driver-monaco');
    expect(m.Monaco.Prompt).to.equal(EditorPrompt);
  });
});

