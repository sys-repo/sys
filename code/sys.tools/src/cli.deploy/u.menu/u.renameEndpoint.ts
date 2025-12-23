import { type t, Fs, Time } from '../common.ts';
import { EndpointsFs } from '../u.endpoints/mod.ts';

type RenameEndpointResult =
  | { readonly ok: true; readonly toRel: t.StringPath }
  | { readonly ok: false; readonly error: unknown };

/**
 * Rename an endpoint:
 * - move (or create) YAML file
 * - update config index + lastUsedAt
 * - save config
 *
 * Never throws.
 */
export async function renameEndpoint(args: {
  config: t.DeployTool.Config.File;
  cwd: t.StringDir;
  ref: { name: string; file: string };
  nextName: string;
}): Promise<RenameEndpointResult> {
  const { config, cwd, ref, nextName } = args;

  try {
    const fromRel = String(ref.file);
    const toRel = EndpointsFs.fileOf(nextName);

    const fromAbs = Fs.join(cwd, fromRel);
    const toAbs = Fs.join(cwd, toRel);

    await Fs.ensureDir(Fs.join(cwd, EndpointsFs.dir));

    if (await Fs.exists(fromAbs)) {
      await Fs.move(fromAbs, toAbs);
    } else {
      await EndpointsFs.ensureInitialYaml(toAbs, nextName);
    }

    config.change((doc) => {
      const now = Time.now.timestamp;
      const current = doc.endpoints ?? [];
      const lastUsedAt = now;
      doc.endpoints = current.map((e) => {
        return e.name === ref.name ? { ...e, name: nextName, file: toRel, lastUsedAt } : e;
      });
    });

    await config.fs.save();
    return { ok: true, toRel };
  } catch (error) {
    return { ok: false, error };
  }
}
