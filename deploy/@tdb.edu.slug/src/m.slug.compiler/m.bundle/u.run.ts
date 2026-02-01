import { type t } from '../common.ts';
import { selectBundleProfile, selectBundleProfileAction } from './u.menu.ts';
import { runProfile } from './u.profile.ts';

/**
 * Run the bundler using the given CRDT commands
 */
export const run: t.SlugBundleLib['run'] = async (args) => {
  if (!args.interactive) {
    const pick = await selectBundleProfile(args.cwd, { interactive: false });
    if (pick.kind !== 'run') return { kind: 'stay' };
    await runProfile({ cwd: args.cwd, cmd: args.cmd, profilePath: pick.profile });
    return { kind: 'stay' };
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
};
