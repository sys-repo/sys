import { describe, expect, it } from '../../-test.ts';
import { EditorCrdt, useBinding, useFoldMarks } from './mod.ts';

describe('Monaco/Crdt', () => {
  it('API', async () => {
    const m = await import('@sys/driver-monaco');
    expect(m.Monaco.Crdt).to.equal(EditorCrdt);
    expect(m.Monaco.Crdt.useBinding).to.equal(useBinding);
    expect(m.Monaco.Crdt.useFoldMarks).to.equal(useFoldMarks);
  });
});
