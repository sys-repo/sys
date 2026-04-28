import { Env, Fs, HttpServer, type t } from '../common.ts';
import { pkg } from '../../pkg.ts';
import { createApp } from './u.app.ts';

type F = t.StripeFixture.Lib['start'];

export const start: F = async (args = {}) => {
  const cwd = args.cwd ?? Fs.cwd();
  const env = await Env.load({ cwd, search: 'cwd' });
  const hostname = args.hostname ?? '127.0.0.1';
  const port = args.port ?? readPort(env.get('STRIPE_FIXTURE_PORT'), 9090);
  const app = createApp({ cwd });
  return HttpServer.start(app, { port, pkg, hostname, silent: args.silent });
};

/**
 * Helpers:
 */
function readPort(input: string, fallback: number) {
  const port = Number(input || fallback);
  if (!Number.isInteger(port) || port <= 0 || port > 65_535) {
    throw new Error(`Invalid STRIPE_FIXTURE_PORT: ${JSON.stringify(input)}`);
  }
  return port as t.PortNumber;
}
