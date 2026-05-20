import { describe, expect, it } from '../../-test.ts';
import { FilesMemory } from '../mod.ts';

describe('FilesMemory', () => {
  it('API: public export', async () => {
    const m = await import('@sys/model/files/memory');

    expect(m.FilesMemory).to.equal(FilesMemory);
  });
});
