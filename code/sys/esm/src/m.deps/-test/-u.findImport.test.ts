import { describe, Deps, expect, it } from './common.ts';

describe('Deps.findImport', () => {
  it('returns the canonical import for a versionless stem', async () => {
    const { data, error } = await Deps.from(`
      deno.json:
        - import: npm:esbuild@0.27.3
    `);
    expect(error).to.eql(undefined);
    expect(Deps.findImport(data?.entries, 'npm:esbuild')).to.eql('npm:esbuild@0.27.3');
  });

  it('returns undefined when no matching import exists', async () => {
    const { data, error } = await Deps.from(`
      deno.json:
        - import: npm:vite@7.3.1
    `);
    expect(error).to.eql(undefined);
    expect(Deps.findImport(data?.entries, 'npm:esbuild')).to.eql(undefined);
  });
});
