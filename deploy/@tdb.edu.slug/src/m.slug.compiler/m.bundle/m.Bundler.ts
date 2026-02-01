import { type t, c } from '../common.ts';
import { buildDocumentDag } from './u.dag.ts';
import { selectBundleProfile } from './u.menu.ts';
import { readBundleProfile } from './u.profile.ts';
import { bundleSequenceFilepaths } from './u.seq.files.bundle.ts';
import { runSlugTreeFs } from './u.slug-tree.ts';
import { validateBundleConfig } from './u.validate.ts';

export const Bundler = {
  async run(args: { cwd: t.StringDir; cmd: t.Crdt.Cmd.Client; interactive?: boolean }) {
    const pick = await selectBundleProfile(args.cwd, { interactive: args.interactive });
    if (pick.kind !== 'run') return { kind: pick.kind } as const;

    const validation = await validateBundleConfig(pick.profile);
    if (!validation.ok) {
      const errors = validation.errors
        .map((err) => `${String(err.path ?? '').trim() || '<root>'}: ${err.message}`)
        .join('\n  ');
      console.info(c.yellow(`bundle profile invalid:\n  ${errors}`));
      return { kind: 'stay' } as const;
    }

    const profile = await readBundleProfile(pick.profile);
    const mediaSeq = profile['bundle:slug-tree:media:seq'];
    if (mediaSeq) {
      const rawDocid = String(mediaSeq.crdt.docid ?? '').trim();
      if (!rawDocid || rawDocid === '<tbd>') {
        console.info(
          c.yellow(
            'warning: bundle:slug-tree:media:seq skipped (crdt.docid missing or placeholder)',
          ),
        );
        return { kind: 'stay' } as const;
      }
      const docid = rawDocid.startsWith('crdt:') ? (rawDocid as t.Crdt.Id) : (`crdt:${rawDocid}` as t.Crdt.Id);
      const yamlPath = parseYamlPath(mediaSeq.crdt.path);
      const dag = await buildDocumentDag(args.cmd, docid, yamlPath);
      await bundleSequenceFilepaths(dag, yamlPath, docid, {
        target: mediaSeq.target,
        requirePlayback: mediaSeq.requirePlayback,
      });
    }

    if (profile['bundle:slug-tree:fs']) {
      await runSlugTreeFs({
        cwd: args.cwd,
        profilePath: pick.profile,
        createCrdt: async () => 'crdt:create' as t.StringRef,
      });
    }

    return { kind: 'stay' } as const;
  },

  async validate(args: { path: t.StringFile }) {
    return await validateBundleConfig(args.path);
  },

  async selectProfile(args: { cwd: t.StringDir; interactive?: boolean }) {
    return await selectBundleProfile(args.cwd, { interactive: args.interactive });
  },

  async slugTreeFs(args: {
    cwd: t.StringDir;
    profilePath: t.StringFile;
    createCrdt: () => Promise<t.StringRef>;
  }): Promise<void> {
    await runSlugTreeFs(args);
  },

  async mediaSeq(args: { dag: t.Graph.Dag.Result; profilePath: t.StringFile }): Promise<void> {
    const { dag, profilePath } = args;
    const profile = await readBundleProfile(profilePath);
    const mediaSeq = profile['bundle:slug-tree:media:seq'];
    if (!mediaSeq) return;

    const yamlPath = parseYamlPath(mediaSeq.crdt.path);
    const docid = mediaSeq.crdt.docid as t.Crdt.Id;
    await bundleSequenceFilepaths(dag, yamlPath, docid, {
      target: mediaSeq.target,
      requirePlayback: mediaSeq.requirePlayback,
    });
  },
} as const;

function parseYamlPath(input: t.StringPath): t.ObjectPath {
  const raw = String(input ?? '').trim();
  if (!raw) return [] as t.ObjectPath;
  const parts = raw.split('/').filter((p) => p.length > 0);
  return parts as t.ObjectPath;
}
