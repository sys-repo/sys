import { describe, expect, it } from '../-test.ts';
import { Bundler, Linter, Slug, Tasks } from '../mod.ts';

describe(`slug system: compiler`, () => {
  it('API', async () => {
    const m = await import('@tdb/edu-slug/compiler');
    expect(m.Bundler).to.equal(Bundler);
    expect(m.Linter).to.equal(Linter);
    expect(m.Tasks).to.equal(Tasks);
    expect(m.Slug).to.equal(Slug);
  });
});
