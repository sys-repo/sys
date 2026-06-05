import { describe, expect, it } from '../../-test.ts';
import { useKeyboard } from '../mod.ts';

describe('use (hooks)', () => {
  it('API', async () => {
    const m = await import('@sys/ui-react-devharness/react/hooks');
    expect(m.useKeyboard).to.equal(useKeyboard);
  });
});
