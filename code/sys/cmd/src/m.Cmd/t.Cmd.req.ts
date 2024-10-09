import type { t, u } from './common.ts';

/**
 * INVOKE methods:
 */
export type CmdInvokeOptions<C extends t.CmdType> = {
  tx?: t.StringTx;
  issuer?: t.StringId;
  error?: u.ExtractError<C>;
};
export type CmdInvokeResponseOptions<
  Req extends t.CmdType,
  Res extends t.CmdType,
> = CmdInvokeOptions<Req> & {
  dispose$?: t.UntilObservable;
  timeout?: t.Msecs;
  onComplete?: t.CmdResponseHandler<Req, Res>;
  onError?: t.CmdResponseHandler<Req, Res>;
  onTimeout?: t.CmdResponseHandler<Req, Res>;
};

/**
 * Invoke with no response.
 */
export type CmdInvoke<C extends t.CmdType> = <N extends C['name']>(
  name: N,
  params: u.CmdTypeMap<C>[N]['params'],
  options?: t.StringTx | CmdInvokeOptions<u.CmdTypeMap<C>[N]>,
) => t.CmdInvoked<u.CmdTypeMap<C>[N]>;

/**
 * Invoke with expected response.
 */
export type CmdInvokeResponse<Req extends t.CmdType, Res extends t.CmdType> = (
  req: Req['name'],
  res: Res['name'],
  params: Req['params'],
  options?: t.StringTx | t.CmdResponseHandler<Req, Res> | t.CmdInvokeResponseOptions<Req, Res>,
) => t.CmdResponseListener<Req, Res>;

/**
 * Request.
 */
export type CmdRequest<C extends t.CmdType> = {
  readonly name: C['name'];
  readonly params: C['params'];
};
