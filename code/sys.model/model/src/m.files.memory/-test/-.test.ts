import { describe, expect, it } from '../../-test.ts';
import { FilesMemory } from '../mod.ts';

describe('FilesMemory', () => {
  it('API: public export', async () => {
    const m = await import('@sys/model/files/memory');

    expect(m.FilesMemory).to.equal(FilesMemory);
    expect(Object.keys(FilesMemory).sort()).to.eql(['Readonly', 'Writable']);
    expect(Object.keys(FilesMemory.Readonly).sort()).to.eql(['create']);
    expect(Object.keys(FilesMemory.Writable).sort()).to.eql(['create', 'live']);
  });
});
