import type { t, u } from './common.ts';

/**
 * Response.
 */
export type CmdInvoked<C extends t.CmdType> = {
  readonly tx: t.StringTx;
  readonly req: t.CmdRequest<C>;
  readonly issuer?: t.StringId;
};

/**
 * Response Listener API.
 */
export type CmdResponseListener<
  Req extends t.CmdType,
  Res extends t.CmdType,
> = t.CmdInvoked<Req> & {
  readonly $: t.Observable<Res['params']>;
  readonly ok: boolean;
  readonly status: 'Pending' | 'Complete' | 'Error' | 'Timeout';
  readonly result?: Res['params'];
  readonly error?: u.ExtractError<Res>;
  readonly issuer?: t.StringId;
  promise(): Promise<CmdResponseListener<Req, Res>>;
  onComplete(fn: CmdResponseHandler<Req, Res>): CmdResponseListener<Req, Res>;
  onError(fn: CmdResponseHandler<Req, Res>): CmdResponseListener<Req, Res>;
  onTimeout(fn: CmdResponseHandler<Req, Res>): CmdResponseListener<Req, Res>;
} & t.Lifecycle;

/**
 * Callbacks from the response listener.
 */
export type CmdResponseHandler<Req extends t.CmdType, Res extends t.CmdType> = (
  e: CmdResponseHandlerArgs<Req, Res>,
) => void;

/**
 * Arguments passed to the command response handler.
 */
export type CmdResponseHandlerArgs<Req extends t.CmdType, Res extends t.CmdType> = Pick<
  CmdResponseListener<Req, Res>,
  'ok' | 'tx' | 'issuer' | 'result' | 'error'
>;
