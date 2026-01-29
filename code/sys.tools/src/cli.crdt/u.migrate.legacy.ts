import { type t, c, Fs, Is, Json } from './common.ts';

const LEGACY_FILENAME = '-crdt.config.json';
const LEGACY_DIR = '-config';

export type LegacyConfigDoc = {
  /** Legacy doc entries. */
  docs?: Array<{
    id: string;
    name?: string;
    createdAt?: number;
    lastUsedAt?: number;
  }>;
  /** Legacy repo sync endpoints. */
  repo?: { daemon?: { sync?: { websockets?: string[] } } };
};

export type LegacyConfig = {
  readonly path: t.StringPath;
  readonly doc: LegacyConfigDoc;
};

export async function loadLegacyConfig(cwd: t.StringDir): Promise<LegacyConfig | undefined> {
  const path = Fs.join(cwd, LEGACY_DIR, LEGACY_FILENAME);
  if (!(await Fs.exists(path))) return;

  const read = await Fs.readText(path);
  if (!read.ok || !read.data) return;

  const parsed = Json.safeParse(read.data);
  if (!parsed.ok || !Is.record(parsed.data)) {
    console.info(c.yellow(`Legacy config is invalid: ${Fs.trimCwd(path)}`));
    return;
  }

  return { path, doc: parsed.data as LegacyConfigDoc };
}

export async function removeLegacyConfig(path: t.StringPath) {
  await Fs.remove(path);
}
