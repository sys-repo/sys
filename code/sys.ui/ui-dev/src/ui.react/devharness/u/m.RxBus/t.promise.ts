import type { t } from './common.ts';

/**
 * Promise conversion helpers.
 */
export type RxAsPromise = {
  first<P>(
    ob$: t.Observable<P>,
    options?: { op?: string; timeout?: t.Msecs },
  ): Promise<RxPromiseResponse<P>>;
};

/** An error thrown during an Rx/Observable promise operation. */
export type RxPromiseError = {
  code: 'timeout' | 'completed' | 'unknown';
  message: string;
};

/** The response returned from an Rx/Observable wrapped promise. */
export type RxPromiseResponse<P> = {
  payload?: P;
  error?: t.RxPromiseError;
};
