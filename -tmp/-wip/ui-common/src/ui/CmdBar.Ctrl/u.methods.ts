import { Cmd, DEFAULTS, type t } from './common.ts';
import { Is } from './u.ts';

type C = t.CmdBarCtrlType;
type Cmd = t.Cmd<C>;
type CInput = t.CmdBarRef | t.CmdBarCtrl | Cmd;

/**
 * Convert to a wrapped <Ctrl> methods object.
 */
export function toCtrl(input: CInput): t.CmdBarCtrl {
  if (Is.ctrl(input)) return input;
  if (Is.ref(input)) return input.ctrl;
  return methods(input);
}

/**
 * Convert to the primitive <Cmd>.
 */
export function toCmd(input: CInput): Cmd {
  if (Cmd.Is.cmd(input)) return input as Cmd;
  if (Is.ctrl(input)) return (input as any)[DEFAULTS.symbol.cmd] as Cmd;
  if (Is.ref(input)) return toCmd(input.ctrl);
  throw new Error('Could not derive <Cmd> from input');
}

/**
 * Derive the paths from the given Command input.
 */
export function toPaths(input: CInput): t.CmdBarPaths {
  const cmd = toCmd(input) as any;
  return cmd[DEFAULTS.symbol.paths];
}

/**
 * Wrap the command with methods.
 */
export function methods(cmd: t.Cmd<t.CmdBarCtrlType>): t.CmdBarCtrl {
  const method = cmd.method;
  const api: t.CmdBarCtrl = {
    current: method('Current', 'Current:res'),
    focus: method('Focus'),
    select: method('Select'),
    caretToStart: method('Caret:ToStart'),
    caretToEnd: method('Caret:ToEnd'),
    invoke: method('Invoke'),
    keyboard: method('Keyboard'),
    history: method('History'),
    update: method('Update'),
    clear: method('Clear'),
    events: (dispose$?: t.UntilObservable) => cmd.events(dispose$),
  };
  (api as any)[DEFAULTS.symbol.cmd] = cmd;
  return api;
}
