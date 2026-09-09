import type { StartDependencies } from '../u.server.start/common.ts';
import {
  createVerifiedRequestHandler,
  type VerifiedRequestArgs,
  type VerifiedRequestHandler,
} from './u.request.handler.ts';

type VerifiedRequestTransport = Readonly<{
  app: ReturnType<StartDependencies['createApp']>;
  bindAuthority: VerifiedRequestHandler['bindAuthority'];
}>;

/**
 * Build the authenticated request transport for one freshly verified Dist.
 * Request admission remains closed until the exact listener authority has been bound.
 */
export function createVerifiedRequestTransport(
  args: VerifiedRequestArgs,
): VerifiedRequestTransport {
  const requests = createVerifiedRequestHandler(args);
  const app = args.deps.createApp();

  app.all('*', requests.handle);

  return Object.freeze({
    app,
    bindAuthority: requests.bindAuthority,
  });
}
