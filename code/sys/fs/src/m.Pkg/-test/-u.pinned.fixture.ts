import { Hash, Json, StdPath, type t } from '../../-test.ts';
import { Pkg } from '../mod.ts';
import { DEFAULT_IO, type PinnedIo } from '../u.verify/u.pinned.io.ts';

const encoder = new TextEncoder();

export const limits: t.Pkg.Dist.Pinned.Verify.Limits = Object.freeze({
  manifestBytes: 1024 * 1024,
  entries: 100,
  fileBytes: 1024 * 1024,
  totalBytes: 4 * 1024 * 1024,
});

export type Fixture = Awaited<ReturnType<typeof setup>>;

export async function setup() {
  const created = await Deno.makeTempDir({ prefix: 'Pkg.Dist.Pinned.' });
  const dir = await Deno.realPath(created);
  await Deno.mkdir(StdPath.join(dir, 'assets'));
  await Deno.mkdir(StdPath.join(dir, 'pkg'));
  await Deno.writeTextFile(StdPath.join(dir, 'index.html'), '<h1>verified</h1>');
  await Deno.writeTextFile(
    StdPath.join(dir, 'assets/app.js'),
    'console.info("verified");',
  );
  await Deno.writeTextFile(StdPath.join(dir, 'pkg/mod.ts'), 'export const value = 123;');

  const computed = await Pkg.Dist.compute({
    dir,
    pkg: { name: '@test/fixture', version: '1.0.0' },
    builder: { name: '@test/builder', version: '1.0.0' },
    save: true,
  });
  const manifest = await readManifest(dir);

  return {
    dir,
    dist: computed.dist,
    integrity: Hash.sha256(manifest),
    manifest,
  };
}

export async function teardown(fixture: Fixture) {
  await Deno.remove(fixture.dir, { recursive: true });
}

export async function readManifest(dir: string): Promise<Uint8Array> {
  return await Deno.readFile(StdPath.join(dir, 'dist.json'));
}

export async function writeManifest(
  dir: string,
  dist: t.DistPkg,
): Promise<{ readonly bytes: Uint8Array; readonly integrity: t.StringHash }> {
  const bytes = encoder.encode(Json.stringify(dist, 2));
  await Deno.writeFile(StdPath.join(dir, 'dist.json'), bytes);
  return { bytes, integrity: Hash.sha256(bytes) };
}

/** Derive exact read authority from one manifest part value. */
export function fixturePart(
  fixture: Fixture,
  path: t.StringPath,
): t.Pkg.Dist.Pinned.ReadPart.Args {
  const value = fixture.dist.hash.parts[path];
  if (!value) throw new Error(`Expected fixture part: ${path}`);
  const parsed = Pkg.Dist.Part.parse(value);
  if (!parsed || parsed.size === undefined) {
    throw new Error(`Expected sized fixture part: ${path}`);
  }
  return {
    dir: fixture.dir,
    path,
    checksum: parsed.hash,
    size: parsed.size,
  };
}

export function cloneDist(dist: t.DistPkg): t.DeepMutable<t.DistPkg> {
  return Json.parse(Json.stringify(dist)) as t.DeepMutable<t.DistPkg>;
}

export function withIo(overrides: Partial<PinnedIo>): PinnedIo {
  return Object.freeze({ ...DEFAULT_IO, ...overrides });
}

export { DEFAULT_IO };
