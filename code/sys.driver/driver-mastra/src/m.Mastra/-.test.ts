import { describe, expect, it } from '../-test.ts';
import { Memory } from '../m.Memory/mod.ts';
import { Mastra } from './mod.ts';

describe('Mastra', () => {
  it('API', async () => {
    const m = await import('@sys/driver-mastra');
    expect(m.Mastra).to.equal(Mastra);
    expect(Mastra.Memory).to.equal(Memory);
  });
});
