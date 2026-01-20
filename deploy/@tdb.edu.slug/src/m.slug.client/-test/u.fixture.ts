import { expect } from '../../-test.ts';
import { Http } from '../common.ts';

export async function withStubFetcher(
  args: { expectedUrl: string; response: unknown },
  fn: () => Promise<void>,
) {
  const originalFetcher = Http.fetcher;
  const stubFetcher = {
    async json(url: string) {
      expect(url).to.eql(args.expectedUrl);
      return args.response;
    },
  };

  (Http as any).fetcher = () => stubFetcher as never;
  try {
    await fn();
  } finally {
    (Http as any).fetcher = originalFetcher;
  }
}
