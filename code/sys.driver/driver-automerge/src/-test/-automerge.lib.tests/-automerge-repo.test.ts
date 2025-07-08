import { AutomergeRepo, describe, expect, expectError, it } from '../mod.ts';

describe('automerge-repo: raw underlying API assertions', () => {
  it('delete handle', async () => {
    const repo = new AutomergeRepo();
    const handleA = repo.create({});
    const id = handleA.documentId;

    await handleA.whenReady();
    expect(handleA.isDeleted()).to.eql(false);

    const handleB = await repo.find(id);
    expect(handleB.isDeleted()).to.eql(false);

    repo.delete(id);
    expect(handleA.isDeleted()).to.eql(true);

    // Document is no longer in repo:
    await expectError(() => repo.find(id), `Document ${id} is unavailable`);
  });
});
