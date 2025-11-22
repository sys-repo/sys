import type { t } from './common.ts';

/** Classification for command-client errors. */
export type CmdErrorKind = 'CmdErrorTimeout' | 'CmdErrorClientDisposed' | 'CmdErrorRemote';

/** Context attached to command-client errors. */
export type CmdErrorMeta = {
  readonly name: t.CmdName;
  readonly id?: t.CmdReqId;
};

/** Error instance produced by the command client. */
export type CmdError = Error & {
  name: CmdErrorKind;
  cmd?: CmdErrorMeta;
};
