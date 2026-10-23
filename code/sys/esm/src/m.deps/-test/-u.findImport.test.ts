import { describe, Deps, expect, it } from './common.ts';

describe('Deps.findImport', () => {
  it('returns the canonical import for a versionless stem', async () => {
    const { data, error } = await Deps.from(`
      deno.json:
        - import: npm:left-pad@1.3.0
    `);
    expect(error).to.eql(undefined);
    expect(Deps.findImport(data?.entries, 'npm:left-pad')).to.eql('npm:left-pad@1.3.0');
  });

  it('returns undefined when no matching import exists', async () => {
    const { data, error } = await Deps.from(`
      deno.json:
        - import: npm:vite@7.3.1
    `);
    expect(error).to.eql(undefined);
    expect(Deps.findImport(data?.entries, 'npm:left-pad')).to.eql(undefined);
  });
});
