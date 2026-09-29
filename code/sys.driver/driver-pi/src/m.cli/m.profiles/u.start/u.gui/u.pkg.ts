import { Is, Json, Obj, Pinned, Pkg, type t } from './common.ts';
import type { Start } from './t.ts';

/** Pi policy over Vite's covered package declaration, not generic Dist metadata. */
export const GUI_PACKAGE_POLICY = Object.freeze({
  path: 'pkg/-pkg.json',
  maxBytes: 16 * 1024,
  name: 256,
  version: 256,
});

/** Read only the inventoried, bounded, checksum-matched package declaration. */
export async function readGuiPackage(
  dir: t.StringAbsoluteDir,
  content: t.DistContent,
  until?: AbortSignal,
  readPart: Start.Gui.Dependencies['readPart'] = Pinned.readPart,
): Promise<Readonly<t.Pkg> | undefined> {
  if (until?.aborted || !Obj.hasOwn(content.parts, GUI_PACKAGE_POLICY.path)) return;
  const part = Pkg.Dist.Part.parse(content.parts[GUI_PACKAGE_POLICY.path]);
  if (!part || part.size === undefined || part.size > GUI_PACKAGE_POLICY.maxBytes) return;
  const result = await readPart({
    dir,
    path: GUI_PACKAGE_POLICY.path,
    checksum: part.hash,
    size: part.size,
    until,
  });
  if (until?.aborted || result.kind !== 'read') return;
  try {
    const text = new TextDecoder('utf-8', { fatal: true }).decode(result.bytes);
    return snapshotGuiPackage(Json.parse<unknown>(text));
  } catch {
    return;
  }
}

/** Required own fields only; never manufacture unknown package defaults. */
export function snapshotGuiPackage(input: unknown): Readonly<t.Pkg> | undefined {
  if (!Is.plainObject(input) || !Pkg.Is.pkg(input)) return;
  if (!Obj.hasOwn(input, 'name') || !Obj.hasOwn(input, 'version')) return;
  const { name, version } = input;
  if (!boundedIdentity(name, GUI_PACKAGE_POLICY.name)) return;
  if (!boundedIdentity(version, GUI_PACKAGE_POLICY.version)) return;
  return Object.freeze({ name, version });
}

/** Pi's package strings are bounded and reject control characters and malformed Unicode. */
function boundedIdentity(input: string, max: number): boolean {
  if (input.length === 0 || input.length > max || !input.isWellFormed()) return false;
  // Required character admission examines each UTF-16 code unit.
  for (let index = 0; index < input.length; index += 1) {
    const code = input.charCodeAt(index);
    if (code <= 0x1f || code === 0x7f) return false;
  }
  return true;
}
