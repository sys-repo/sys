import { describe, expect, it } from '../../-test.ts';
import { useMiniApp } from './mod.ts';

describe('hooks', () => {
  it('import API', async () => {
    const m = await import('@sys/driver-farcaster/ui');
    expect(m.useMiniApp).to.equal(useMiniApp);
  });
});
