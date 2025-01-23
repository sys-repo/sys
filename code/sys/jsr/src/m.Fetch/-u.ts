import { type t, expect } from '../-test.ts';

export const assertFetchDisposed = (res: t.FetchResponse<unknown>) => {
  expect(res.status).to.eql(499);
  expect(res.data).to.eql(undefined);
  expect(res.error?.message).to.include('HTTP/GET request failed');
  expect(res.error?.cause?.message).to.include('disposed before completing (499)');
};
