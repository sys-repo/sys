import { type t, describe, it, expect } from '../-test.ts';

describe('UI.Components', () => {
  it('import → API', async () => {
    const { FOO } = await import('@sys/driver-vitepress/ui');
    console.log('FOO', FOO);
  });
});
