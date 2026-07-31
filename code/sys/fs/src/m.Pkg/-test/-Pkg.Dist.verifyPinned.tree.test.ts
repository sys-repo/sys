import { describe, expect, Ignore, it, StdPath } from '../../-test.ts';
import { Pkg } from '../mod.ts';
import { verifyPinnedWithIo } from '../u.verify/u.pinned.ts';
import {
  cloneDist,
  DEFAULT_IO,
  limits,
  setup,
  teardown,
  withIo,
  writeManifest,
} from './-u.verifyPinned.fixture.ts';

describe('Pkg.Dist.verifyPinned exact tree and content', () => {
  it('rejects missing, truncated, enlarged, and tampered declared assets', async () => {
    for (const mutation of ['missing', 'truncated', 'enlarged', 'tampered'] as const) {
      const fixture = await setup();
      try {
        const path = `${fixture.dir}/assets/app.js`;
        const original = await Deno.readTextFile(path);
        if (mutation === 'missing') await Deno.remove(path);
        if (mutation === 'truncated') await Deno.writeTextFile(path, original.slice(0, -1));
        if (mutation === 'enlarged') await Deno.writeTextFile(path, `${original}!`);
        if (mutation === 'tampered') {
          await Deno.writeTextFile(path, original.replace('verified', 'tampered'));
        }

        const result = await Pkg.Dist.verifyPinned({
          dir: fixture.dir,
          integrity: fixture.integrity,
          limits,
        });
        expect(result).to.eql({ kind: 'content-mismatch' });
      } finally {
        await teardown(fixture);
      }
    }
  });

  it('rejects a declared file or structural directory observed with the wrong kind', async () => {
    const fileFixture = await setup();
    try {
      await Deno.remove(`${fileFixture.dir}/assets/app.js`);
      await Deno.mkdir(`${fileFixture.dir}/assets/app.js`);
      const file = await Pkg.Dist.verifyPinned({
        dir: fileFixture.dir,
        integrity: fileFixture.integrity,
        limits,
      });
      expect(file).to.eql({ kind: 'content-mismatch' });
    } finally {
      await teardown(fileFixture);
    }

    const directoryFixture = await setup();
    try {
      await Deno.remove(`${directoryFixture.dir}/assets`, { recursive: true });
      await Deno.writeTextFile(`${directoryFixture.dir}/assets`, 'not a directory');
      const directory = await Pkg.Dist.verifyPinned({
        dir: directoryFixture.dir,
        integrity: directoryFixture.integrity,
        limits,
      });
      expect(directory).to.eql({ kind: 'content-mismatch' });
    } finally {
      await teardown(directoryFixture);
    }
  });

  it('rejects undeclared, sidecar, temporary, and empty-directory entries', async () => {
    for (const mutation of ['undeclared', 'sidecar', 'temporary', 'directory'] as const) {
      const fixture = await setup();
      try {
        if (mutation === 'undeclared') {
          await Deno.writeTextFile(`${fixture.dir}/extra.txt`, 'extra');
        }
        if (mutation === 'sidecar') {
          await Deno.writeTextFile(`${fixture.dir}/dist.json.sig`, 'signature');
        }
        if (mutation === 'temporary') {
          await Deno.writeTextFile(`${fixture.dir}/.sys-rooted-tmp-leftover`, 'temporary');
        }
        if (mutation === 'directory') await Deno.mkdir(`${fixture.dir}/empty`);

        const result = await Pkg.Dist.verifyPinned({
          dir: fixture.dir,
          integrity: fixture.integrity,
          limits,
        });
        expect(result).to.eql({ kind: 'unexpected-entry' });
      } finally {
        await teardown(fixture);
      }
    }
  });

  it('rejects a stable special filesystem entry', async () => {
    const fixture = await setup();
    try {
      const special = StdPath.join(fixture.dir, 'special');
      await Deno.writeTextFile(special, 'represented as a special entry by the host seam');
      const io = withIo({
        lstat: async (path) => {
          const info = await DEFAULT_IO.lstat(path);
          return path === special
            ? { ...info, isFile: false, isDirectory: false, isSymlink: false }
            : info;
        },
      });

      const result = await verifyPinnedWithIo(
        { dir: fixture.dir, integrity: fixture.integrity, limits },
        io,
      );
      expect(result).to.eql({ kind: 'unexpected-entry' });
    } finally {
      await teardown(fixture);
    }
  });

  it('rejects a filesystem entry explicitly ignored by the authenticated policy', async () => {
    const fixture = await setup();
    try {
      const dist = cloneDist(fixture.dist);
      const rules = Ignore.normalize([...dist.build.hash.ignore!.rules, '.DS_Store']);
      dist.build.hash.ignore = {
        format: 'gitignore',
        rules: [...rules],
        'rules:digest': await Ignore.digest(rules),
      };
      const manifest = await writeManifest(fixture.dir, dist);
      await Deno.writeTextFile(`${fixture.dir}/.DS_Store`, 'authenticated as ignored');

      const result = await Pkg.Dist.verifyPinned({
        dir: fixture.dir,
        integrity: manifest.integrity,
        limits,
      });
      expect(result).to.eql({ kind: 'unexpected-entry' });
    } finally {
      await teardown(fixture);
    }
  });

  it('rejects declared-file and structural-directory symlinks in isolation', async () => {
    const fileFixture = await setup();
    const outside = await Deno.makeTempFile({ prefix: 'Pkg.Dist.verifyPinned.outside.' });
    try {
      await Deno.writeTextFile(outside, 'outside');
      await Deno.remove(`${fileFixture.dir}/assets/app.js`);
      await Deno.symlink(outside, `${fileFixture.dir}/assets/app.js`);
      const file = await Pkg.Dist.verifyPinned({
        dir: fileFixture.dir,
        integrity: fileFixture.integrity,
        limits,
      });
      expect(file).to.eql({ kind: 'symlink' });
    } finally {
      await Deno.remove(outside);
      await teardown(fileFixture);
    }

    const directoryFixture = await setup();
    try {
      await Deno.remove(`${directoryFixture.dir}/assets`, { recursive: true });
      await Deno.symlink(directoryFixture.dir, `${directoryFixture.dir}/assets`);
      const directory = await Pkg.Dist.verifyPinned({
        dir: directoryFixture.dir,
        integrity: directoryFixture.integrity,
        limits,
      });
      expect(directory).to.eql({ kind: 'symlink' });
    } finally {
      await teardown(directoryFixture);
    }
  });

  it('rejects root and ancestor symlinks before inspecting clean generation contents', async () => {
    const rootFixture = await setup();
    try {
      const alias = `${rootFixture.dir}-alias`;
      await Deno.symlink(rootFixture.dir, alias);
      try {
        const root = await Pkg.Dist.verifyPinned({
          dir: alias,
          integrity: rootFixture.integrity,
          limits,
        });
        expect(root).to.eql({ kind: 'symlink' });
      } finally {
        await Deno.remove(alias);
      }
    } finally {
      await teardown(rootFixture);
    }

    const ancestorFixture = await setup();
    const createdAliasWorkspace = await Deno.makeTempDir({
      prefix: 'Pkg.Dist.verifyPinned.ancestor.',
    });
    const aliasWorkspace = await Deno.realPath(createdAliasWorkspace);
    try {
      const linkedParent = StdPath.join(aliasWorkspace, 'linked-parent');
      await Deno.symlink(StdPath.dirname(ancestorFixture.dir), linkedParent);
      const throughAncestor = StdPath.join(linkedParent, StdPath.basename(ancestorFixture.dir));
      const finalInfo = await Deno.lstat(throughAncestor);
      expect(finalInfo.isDirectory).to.eql(true);
      expect(finalInfo.isSymlink).to.eql(false);

      const ancestor = await Pkg.Dist.verifyPinned({
        dir: throughAncestor,
        integrity: ancestorFixture.integrity,
        limits,
      });
      expect(ancestor).to.eql({ kind: 'symlink' });
    } finally {
      await Deno.remove(aliasWorkspace, { recursive: true });
      await teardown(ancestorFixture);
    }
  });

  it('distinguishes initially missing generation roots and manifests', async () => {
    const fixture = await setup();
    try {
      const root = await Pkg.Dist.verifyPinned({
        dir: `${fixture.dir}/missing`,
        integrity: fixture.integrity,
        limits,
      });
      expect(root).to.eql({ kind: 'missing' });

      await Deno.remove(`${fixture.dir}/dist.json`);
      const manifest = await Pkg.Dist.verifyPinned({
        dir: fixture.dir,
        integrity: fixture.integrity,
        limits,
      });
      expect(manifest).to.eql({ kind: 'missing' });
    } finally {
      await teardown(fixture);
    }
  });

  it('classifies stable wrong-kind generation roots and manifests as content mismatches', async () => {
    const fixture = await setup();
    try {
      await Deno.remove(`${fixture.dir}/dist.json`);
      await Deno.mkdir(`${fixture.dir}/dist.json`);
      const manifest = await Pkg.Dist.verifyPinned({
        dir: fixture.dir,
        integrity: fixture.integrity,
        limits,
      });
      expect(manifest).to.eql({ kind: 'content-mismatch' });

      const createdRootFile = await Deno.makeTempFile({
        prefix: 'Pkg.Dist.verifyPinned.root-file.',
      });
      const fileRoot = await Deno.realPath(createdRootFile);
      try {
        const root = await Pkg.Dist.verifyPinned({
          dir: fileRoot,
          integrity: fixture.integrity,
          limits,
        });
        expect(root).to.eql({ kind: 'content-mismatch' });
      } finally {
        await Deno.remove(fileRoot);
      }
    } finally {
      await teardown(fixture);
    }
  });
});
