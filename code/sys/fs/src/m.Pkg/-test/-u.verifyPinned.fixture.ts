import { Hash, Json, type t } from '../../-test.ts';
import { Pkg } from '../mod.ts';
import { DEFAULT_IO, type VerifyPinnedIo } from '../u.verify/u.pinned.io.ts';

const encoder = new TextEncoder();

export const limits: t.Pkg.Dist.VerifyPinned.Limits = Object.freeze({
  manifestBytes: 1024 * 1024,
  entries: 100,
  fileBytes: 1024 * 1024,
  totalBytes: 4 * 1024 * 1024,
});

export type Fixture = Awaited<ReturnType<typeof setup>>;

export async function setup() {
  const created = await Deno.makeTempDir({ prefix: 'Pkg.Dist.verifyPinned.' });
  const dir = await Deno.realPath(created);
  await Deno.mkdir(`${dir}/assets`);
  await Deno.mkdir(`${dir}/pkg`);
  await Deno.writeTextFile(`${dir}/index.html`, '<h1>verified</h1>');
  await Deno.writeTextFile(`${dir}/assets/app.js`, 'console.info("verified");');
  await Deno.writeTextFile(`${dir}/pkg/mod.ts`, 'export const value = 123;');

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
  return await Deno.readFile(`${dir}/dist.json`);
}

export async function writeManifest(
  dir: string,
  dist: t.DistPkg,
): Promise<{ readonly bytes: Uint8Array; readonly integrity: t.StringHash }> {
  const bytes = encoder.encode(Json.stringify(dist, 2));
  await Deno.writeFile(`${dir}/dist.json`, bytes);
  return { bytes, integrity: Hash.sha256(bytes) };
}

export function cloneDist(dist: t.DistPkg): t.DeepMutable<t.DistPkg> {
  return Json.parse(Json.stringify(dist)) as t.DeepMutable<t.DistPkg>;
}

export function withIo(overrides: Partial<VerifyPinnedIo>): VerifyPinnedIo {
  return Object.freeze({ ...DEFAULT_IO, ...overrides });
}

export { DEFAULT_IO };
