import { type t, c } from '../common.ts';
import { buildDocumentDag } from './u.dag.ts';
import { selectBundleProfile, selectBundleProfileAction } from './u.menu.ts';
import { readBundleProfile } from './u.profile.ts';
import { bundleSequenceFilepaths } from './u.seq.files.bundle.ts';
import { runSlugTreeFs } from './u.slug-tree.ts';
import { validateBundleConfig } from './u.validate.ts';

export const Bundler = {
  async run(args: { cwd: t.StringDir; cmd: t.Crdt.Cmd.Client; interactive?: boolean }) {
    if (!args.interactive) {
      const pick = await selectBundleProfile(args.cwd, { interactive: false });
      if (pick.kind !== 'run') return { kind: 'stay' } as const;
      await runProfile({ cwd: args.cwd, cmd: args.cmd, profilePath: pick.profile });
      return { kind: 'stay' } as const;
    }

    let lastProfile: t.StringFile | undefined;
    let lastAction: 'run' | undefined;

    profileLoop: while (true) {
      let actionPick = await selectBundleProfile(args.cwd, {
        interactive: true,
        defaultProfile: lastProfile,
      });

      if (actionPick.kind === 'exit') return { kind: 'stay' } as const;
      if ('profile' in actionPick && actionPick.profile) {
        lastProfile = actionPick.profile;
      }

      while (true) {
        if (actionPick.kind === 'run') {
          lastAction = 'run';
          if (actionPick.profile) {
            await runProfile({ cwd: args.cwd, cmd: args.cmd, profilePath: actionPick.profile });
          }
          actionPick = await selectBundleProfileAction(args.cwd, actionPick.profile, {
            defaultAction: lastAction,
          });
          if ('profile' in actionPick && actionPick.profile) {
            lastProfile = actionPick.profile;
          }
          continue;
        }

        if (actionPick.kind === 'exit') return { kind: 'stay' } as const;
        if (actionPick.kind === 'back') {
          lastAction = undefined;
          continue profileLoop;
        }
        break;
      }
    }
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

async function runProfile(args: {
  cwd: t.StringDir;
  cmd: t.Crdt.Cmd.Client;
  profilePath: t.StringFile;
}): Promise<void> {
  const { cwd, cmd, profilePath } = args;
  const validation = await validateBundleConfig(profilePath);
  if (!validation.ok) {
    console.info(c.yellow(`bundle profile invalid:\n  ${formatValidationErrors(validation.errors)}`));
    return;
  }

  const profile = await readBundleProfile(profilePath);
  const mediaSeq = profile['bundle:slug-tree:media:seq'];
  if (mediaSeq) {
    const rawDocid = String(mediaSeq.crdt.docid ?? '').trim();
    if (!rawDocid || rawDocid === '<tbd>') {
      console.info(
        c.yellow(
          'warning: bundle:slug-tree:media:seq skipped (crdt.docid missing or placeholder)',
        ),
      );
    } else {
      const docid = rawDocid.startsWith('crdt:')
        ? (rawDocid as t.Crdt.Id)
        : (`crdt:${rawDocid}` as t.Crdt.Id);
      const yamlPath = parseYamlPath(mediaSeq.crdt.path);
      const dag = await buildDocumentDag(cmd, docid, yamlPath);
      await bundleSequenceFilepaths(dag, yamlPath, docid, {
        target: mediaSeq.target,
        requirePlayback: mediaSeq.requirePlayback,
      });
    }
  }

  if (profile['bundle:slug-tree:fs']) {
    await runSlugTreeFs({
      cwd,
      profilePath,
      createCrdt: async () => 'crdt:create' as t.StringRef,
    });
  }
}

function formatValidationErrors(errors: readonly t.ValueError[]): string {
  return errors
    .map((err) => `${String(err.path ?? '').trim() || '<root>'}: ${err.message}`)
    .join('\n  ');
}

function parseYamlPath(input: t.StringPath): t.ObjectPath {
  const raw = String(input ?? '').trim();
  if (!raw) return [] as t.ObjectPath;
  const parts = raw.split('/').filter((p) => p.length > 0);
  return parts as t.ObjectPath;
}
