import { expect, type t } from '../../-test.ts';

export const assertFetchDisposed = (res: t.HttpFetch.Response<unknown>) => {
  expect(res.status).to.eql(499);
  expect(res.data).to.eql(undefined);
  expect(res.error?.message).to.include('HTTP/GET request failed');
  expect(res.error?.cause?.message).to.include('disposed before completing');
};
