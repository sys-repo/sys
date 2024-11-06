import { Cmd, DEFAULTS, Immutable, type t } from './common.ts';
import { listen } from './Ctrl.listen.ts';
import { Is, methods, Path, toCmd, toCtrl, toPaths } from './u.ts';

type C = t.CmdBarCtrlType;

/**
 * API for controlling the <CmdBar> component via logical commands.
 */
export const Ctrl = {
  Is,
  Path,
  listen,
  toCtrl,
  toCmd,
  toPaths,

  create(
    args: {
      transport?: t.CmdTransport;
      paths?: t.CmdBarPaths | t.ObjectPath;
      issuer?: t.StringId;
    } = {},
  ): t.CmdBarCtrl {
    const { transport, issuer } = args;
    const paths = wrangle.paths(args.paths);
    const cmd = factory(transport, paths, issuer);
    (cmd as any)[DEFAULTS.symbol.paths] = paths;
    return methods(cmd);
  },
} as const;

/**
 * Helpers
 */
function factory(
  transport?: t.CmdTransport,
  cmdpaths: t.CmdBarPaths = DEFAULTS.paths,
  issuer?: t.StringId,
) {
  const paths = Cmd.Path.prepend(cmdpaths.cmd);
  const doc = transport ?? Immutable.clonerRef({});
  const cmd = Cmd.create<C>(doc, { paths, issuer });
  return cmd as t.Cmd<C>;
}

const wrangle = {
  paths(input?: t.CmdBarPaths | t.ObjectPath) {
    const def = DEFAULTS.paths;
    if (!input) return def;
    if (Array.isArray(input)) return Path.prepend(input, def);
    return typeof input === 'object' ? input : def;
  },
} as const;
