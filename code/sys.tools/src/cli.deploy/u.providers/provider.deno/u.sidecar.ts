import { type t, Fs, Schema } from '../../common.ts';
import { type ResolveDenoTargetResult } from './u.resolveTarget.ts';
import { SidecarSchema } from './u.sidecar.schema.ts';

type SidecarDoc = {
  readonly target: { readonly dir: t.StringDir };
  readonly workspace: { readonly dir: t.StringDir };
  readonly root: t.StringDir;
  readonly entry: t.StringPath;
};

type StageLike = {
  readonly target: { readonly dir: t.StringDir };
  readonly root: t.StringDir;
  readonly entry: t.StringPath;
};

export const Sidecar = {
  FILE: '.sys.deploy.deno.stage.json',

  validate(value: unknown) {
    const ok = Schema.Value.Check(SidecarSchema, value);
    const errors = ok ? [] : [...Schema.Value.Errors(SidecarSchema, value)];
    return { ok, errors } as const;
  },

  path(root: t.StringDir): t.StringPath {
    return Fs.join(root, Sidecar.FILE);
  },

  fromStage(
    stage: StageLike,
    resolved: Extract<ResolveDenoTargetResult, { readonly ok: true }>,
  ): SidecarDoc {
    return {
      target: { dir: stage.target.dir },
      workspace: { dir: resolved.sourceRootAbs },
      root: stage.root,
      entry: stage.entry,
    };
  },

  async write(
    root: t.StringDir,
    doc: SidecarDoc,
  ): Promise<SidecarDoc> {
    const checked = Sidecar.validate(doc);
    if (!checked.ok) {
      throw new Error('Invalid Deno stage sidecar payload.');
    }
    await Fs.writeJson(Sidecar.path(root), doc);
    return doc;
  },

  async read(root: t.StringDir): Promise<SidecarDoc> {
    const path = Sidecar.path(root);
    const res = await Fs.readJson<SidecarDoc>(path);
    if (!res.ok || !res.data) {
      throw new Error(`Missing Deno stage sidecar: ${path}`);
    }

    const checked = Sidecar.validate(res.data);
    if (!checked.ok) {
      throw new Error(`Invalid Deno stage sidecar: ${path}`);
    }

    return res.data;
  },
} as const;

export type { SidecarDoc };
