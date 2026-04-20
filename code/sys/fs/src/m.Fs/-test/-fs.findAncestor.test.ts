import { describe, expect, it, sampleDir } from '../../-test.ts';
import { Fs } from '../mod.ts';

describe('Fs.findAncestor', () => {
  it('returns nearest matching ancestor', async () => {
    const sample = sampleDir('fs.findAncestor');
    const root = sample.join('root');
    const nearest = sample.join('root/apps');
    const leaf = sample.join('root/apps/web/src');

    await sample.ensureExists(root, nearest, leaf);
    await Fs.write(sample.join('root/.marker-root'), 'root');
    await Fs.write(sample.join('root/apps/.marker-nearest'), 'nearest');

    const found = await Fs.findAncestor(leaf, async ({ dir }) => {
      return (await Fs.exists(Fs.join(dir, '.marker-nearest'))) ? dir : undefined;
    });

    expect(found).to.eql(nearest);
  });

  it('skips non-matching levels and keeps walking', async () => {
    const sample = sampleDir('fs.findAncestor');
    const root = sample.join('repo');
    const leaf = sample.join('repo/packages/app/src');

    await sample.ensureExists(root, leaf);
    await Fs.write(sample.join('repo/.marker-root'), 'root');

    const found = await Fs.findAncestor(leaf, async ({ dir }) => {
      return (await Fs.exists(Fs.join(dir, '.marker-root'))) ? dir : undefined;
    });

    expect(found).to.eql(root);
  });

  it('returns undefined when no match exists', async () => {
    const sample = sampleDir('fs.findAncestor');
    const leaf = sample.join('repo/packages/app/src');

    await sample.ensureExists(leaf);

    const found = await Fs.findAncestor(leaf, async ({ dir }) => {
      return (await Fs.exists(Fs.join(dir, '.marker'))) ? dir : undefined;
    });

    expect(found).to.eql(undefined);
  });

  it('starts from parent when start is a file', async () => {
    const sample = sampleDir('fs.findAncestor');
    const parent = sample.join('repo/packages/app');
    const file = sample.join('repo/packages/app/main.ts');

    await sample.ensureExists(parent);
    await Fs.write(file, 'export {};');
    await Fs.write(sample.join('repo/packages/app/.marker'), 'marker');

    const visited: string[] = [];
    const found = await Fs.findAncestor(file, async ({ dir }) => {
      visited.push(dir);
      return (await Fs.exists(Fs.join(dir, '.marker'))) ? dir : undefined;
    });

    expect(visited[0]).to.eql(parent);
    expect(found).to.eql(parent);
  });

  it('stops at first defined callback result', async () => {
    const sample = sampleDir('fs.findAncestor');
    const nearest = sample.join('repo/packages/app');
    const higher = sample.join('repo');
    const leaf = sample.join('repo/packages/app/src');

    await sample.ensureExists(higher, leaf);
    await Fs.write(sample.join('repo/.marker'), 'higher');
    await Fs.write(sample.join('repo/packages/app/.marker'), 'nearest');

    const found = await Fs.findAncestor(leaf, async ({ dir }) => {
      if (!(await Fs.exists(Fs.join(dir, '.marker')))) return undefined;
      return { dir, name: Fs.basename(dir) } as const;
    });

    expect(found).to.eql({ dir: nearest, name: 'app' });
  });

  it('supports file-aware predicates via files()', async () => {
    const sample = sampleDir('fs.findAncestor');
    const root = sample.join('repo');
    const leaf = sample.join('repo/packages/app/src');

    await sample.ensureExists(root, leaf);
    await Fs.write(sample.join('repo/deno.json'), '{}');

    const found = await Fs.findAncestor(leaf, async ({ dir, files }) => {
      const names = (await files()).map((file) => file.name);
      return names.includes('deno.json') ? dir : undefined;
    });

    expect(found).to.eql(root);
  });
});
