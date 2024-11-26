import { Cmd, DEFAULTS, ObjectPath, rx, type t } from './common.ts';

/**
 * Flags for the <CmdBar>
 */
export const Is = {
  ctrl(input: any): input is t.CmdBarCtrl {
    if (!isObject(input)) return false;
    return Cmd.Is.cmd(input[DEFAULTS.symbol.cmd]) && hasCtrlMethods(input);
  },

  paths(input: any): input is t.CmdBarPaths {
    if (!isObject(input)) return false;
    const o = input as t.CmdBarPaths;
    return ObjectPath.Is.path(o.cmd) && ObjectPath.Is.path(o.text);
  },

  ref(input: any): input is t.CmdBarRef {
    if (!isObject(input)) return false;
    const o = input as t.CmdBarRef;
    return (
      Is.ctrl(o.ctrl) &&
      Is.paths(o.paths) &&
      rx.Is.observable(o.dispose$) &&
      isObject(o.current) &&
      areFuncs(o.resolve)
    );
  },
} as const;

/**
 * Helpers
 */
function isObject(input: any) {
  return input !== null && typeof input === 'object';
}

function areFuncs(...input: any[]) {
  return input.every((v) => typeof v === 'function');
}

function hasCtrlMethods(input: any) {
  if (input === null || typeof input !== 'object') return false;
  const o = input as t.CmdBarCtrl;
  return areFuncs(o.current, o.focus, o.select, o.caretToStart, o.caretToEnd, o.invoke, o.keyboard);
}
