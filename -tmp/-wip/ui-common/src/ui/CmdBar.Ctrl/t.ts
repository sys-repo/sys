import type { t } from './common.ts';

type O = Record<string, unknown>;

export type CmdBarFocusTarget = 'CmdBar' | 'Main';

/**
 * Paths
 */
export type CmdBarPaths = {
  readonly cmd: t.ObjectPath;
  readonly text: t.ObjectPath;
  readonly meta: t.ObjectPath;
};
export type CmdBarPathResolver = (data: O) => {
  readonly cmd: t.CmdPathsObject<t.CmdBarCtrlType>;
  readonly text: string;
  readonly meta: t.CmdBarMeta;
};

export type CmdBarMeta = {
  readonly history: string[];
  spinning?: boolean;
  readOnly?: boolean;
};

/**
 * Commands for controlling the <CmdBar> UI component.
 */
export type CmdBarCtrlType =
  | Current
  | CurrentR
  | Focus
  | Select
  | CaretToStart
  | CaretToEnd
  | Invoke
  | Keyboard
  | Clear
  | History
  | Update;

type Current = t.CmdType<'Current', O>;
type CurrentR = t.CmdType<'Current:res', { text: string; spinning: boolean; readOnly: boolean }>;
type CaretToStart = t.CmdType<'Caret:ToStart', O>;
type CaretToEnd = t.CmdType<'Caret:ToEnd', O>;
type Invoke = t.CmdType<'Invoke', { text: string }>;
type Keyboard = t.CmdType<'Keyboard', KeyboardAction>;

type Focus = t.CmdType<'Focus', { target?: CmdBarFocusTarget }>;
type Clear = t.CmdType<'Clear', O>;
type Update = t.CmdType<'Update', { text?: string; spinning?: boolean; readOnly?: boolean }>;

type Select = t.CmdType<'Select', SelectP>;
type SelectP = { scope?: 'All' | 'Expand' | 'Toggle:Full' };

type History = t.CmdType<'History', HistoryP>;
type HistoryP = { action: 'ArrowUp' | 'ArrowDown' };

/**
 * Command Methods (ctrl).
 */
export type CmdBarCtrl = {
  readonly current: t.CmdMethodResponder<Current, CurrentR>;
  readonly focus: t.CmdMethodVoid<Focus>;
  readonly select: t.CmdMethodVoid<Select>;
  readonly caretToStart: t.CmdMethodVoid<CaretToStart>;
  readonly caretToEnd: t.CmdMethodVoid<CaretToEnd>;
  readonly invoke: t.CmdMethodVoid<Invoke>;
  readonly keyboard: t.CmdMethodVoid<Keyboard>;
  readonly history: t.CmdMethodVoid<History>;
  readonly update: t.CmdMethodVoid<Update>;
  readonly clear: t.CmdMethodVoid<Clear>;
  events(dispose$?: t.UntilObservable): t.CmdEvents<t.CmdBarCtrlType>;
};

/**
 * Keyboard Actions.
 */
export type KeyboardAction = KeyFocus | KeyFocusMain;
type KeyFocus = { name: 'Focus:CmdBar' };
type KeyFocusMain = { name: 'Focus:Main' };
