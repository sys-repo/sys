import { describe, expect, Fs, it, Testing } from '../../-test.ts';
import { CellMigrate } from '../u.migrate/mod.ts';
import { CellPaths } from '../u/paths.ts';

const validDescriptor = '# keep exact text\nkind: cell\nversion: 1\n';

describe('CellMigrate', () => {
  it('dir --dry-run → plans a valid legacy descriptor move without mutation', async () => {
    const root = await tempRoot('dry-run');
    const legacy = await writeLegacy(root, validDescriptor);
    const canonical = Fs.join(root, CellPaths.descriptor);

    const res = await CellMigrate.dir(root, { dryRun: true });

    expect(res).to.eql({
      planned: [{ from: CellPaths.legacy.descriptor, to: CellPaths.descriptor }],
      migrated: [],
      skipped: [],
    });
    expect(await read(legacy)).to.eql(validDescriptor);
    expect(await Fs.exists(canonical)).to.eql(false);
  });

  it('dir → moves a valid legacy descriptor to the canonical path preserving text', async () => {
    const root = await tempRoot('move');
    const legacy = await writeLegacy(root, validDescriptor);
    const canonical = Fs.join(root, CellPaths.descriptor);

    const res = await CellMigrate.dir(root);

    expect(res).to.eql({
      planned: [],
      migrated: [{ from: CellPaths.legacy.descriptor, to: CellPaths.descriptor }],
      skipped: [],
    });
    expect(await Fs.exists(legacy)).to.eql(false);
    expect(await read(canonical)).to.eql(validDescriptor);
  });

  it('dir → is idempotent after a descriptor has already migrated', async () => {
    const root = await tempRoot('idempotent');
    await writeLegacy(root, validDescriptor);

    await CellMigrate.dir(root);
    const res = await CellMigrate.dir(root);

    expect(res).to.eql({
      planned: [],
      migrated: [],
      skipped: [
        {
          from: CellPaths.legacy.descriptor,
          to: CellPaths.descriptor,
          reason: 'canonical descriptor already exists',
        },
      ],
    });
  });

  it('dir → skips canonical-only roots without mutation', async () => {
    const root = await tempRoot('canonical-only');
    const canonical = Fs.join(root, CellPaths.descriptor);
    await Fs.write(canonical, validDescriptor, { force: true });

    const res = await CellMigrate.dir(root);

    expect(res.skipped).to.eql([
      {
        from: CellPaths.legacy.descriptor,
        to: CellPaths.descriptor,
        reason: 'canonical descriptor already exists',
      },
    ]);
    expect(await read(canonical)).to.eql(validDescriptor);
  });

  it('dir → skips roots with no descriptor', async () => {
    const root = await tempRoot('missing');

    const res = await CellMigrate.dir(root);

    expect(res).to.eql({
      planned: [],
      migrated: [],
      skipped: [
        {
          from: CellPaths.legacy.descriptor,
          to: CellPaths.descriptor,
          reason: 'legacy descriptor not found',
        },
      ],
    });
  });

  it('dir → fails on descriptor ambiguity without mutation', async () => {
    const root = await tempRoot('ambiguous');
    const legacy = await writeLegacy(root, validDescriptor);
    const canonical = Fs.join(root, CellPaths.descriptor);
    await Fs.write(canonical, validDescriptor, { force: true });

    const error = await catchError(() => CellMigrate.dir(root));

    expect(error?.message).to.contain('Cell.migrate: multiple descriptors found:');
    expect(await read(legacy)).to.eql(validDescriptor);
    expect(await read(canonical)).to.eql(validDescriptor);
  });

  it('dir → rejects invalid legacy YAML without mutation', async () => {
    const root = await tempRoot('invalid-legacy-yaml');
    const invalid = 'kind: cell:\n';
    const legacy = await writeLegacy(root, invalid);
    const canonical = Fs.join(root, CellPaths.descriptor);

    const error = await catchError(() => CellMigrate.dir(root));

    expect(error?.message).to.contain('Cell.migrate: legacy descriptor is invalid YAML:');
    expect(await read(legacy)).to.eql(invalid);
    expect(await Fs.exists(canonical)).to.eql(false);
  });

  it('dir → rejects invalid legacy descriptor schemas without mutation', async () => {
    const root = await tempRoot('invalid-legacy-schema');
    const invalid = 'bad: true\n';
    const legacy = await writeLegacy(root, invalid);
    const canonical = Fs.join(root, CellPaths.descriptor);

    const error = await catchError(() => CellMigrate.dir(root));

    expect(error?.message).to.contain('Cell.migrate: legacy descriptor is invalid:');
    expect(await read(legacy)).to.eql(invalid);
    expect(await Fs.exists(canonical)).to.eql(false);
  });

  it('message → reports planned and actual migrated items', () => {
    expect(CellMigrate.message({ planned: [], migrated: [], skipped: [] })).to.eql(undefined);
    expect(
      CellMigrate.message({
        planned: [{ from: 'a', to: 'b' }],
        migrated: [],
        skipped: [],
      }),
    ).to.eql('Would migrate 1 Cell config/runtime item.');
    expect(
      CellMigrate.message({
        planned: [],
        migrated: [{ from: 'a', to: 'b' }, { from: 'c', to: 'd' }],
        skipped: [],
      }),
    ).to.eql('Migrated 2 Cell config/runtime items.');
  });
});

async function tempRoot(name: string) {
  const dir = await Testing.dir(`CellMigrate.${name}`);
  return dir.dir;
}

async function writeLegacy(root: string, text: string) {
  const path = Fs.join(root, CellPaths.legacy.descriptor);
  await Fs.write(path, text, { force: true });
  return path;
}

async function read(path: string) {
  const res = await Fs.readText(path);
  if (!res.ok) throw res.error;
  return res.data ?? '';
}

async function catchError(fn: () => Promise<unknown>): Promise<Error | undefined> {
  try {
    await fn();
    return undefined;
  } catch (error) {
    return error instanceof Error ? error : new Error(String(error));
  }
}
