import { type t, Err, Time } from './common.ts';

export const connect: t.NetLib['connect'] = async (port, options = {}) => {
  const { hostname = '127.0.0.1', attempts = 10, delay = 100, backoff = 1.5 } = options;
  let currentDelay = delay;
  let lastErr: unknown;

  const done = (socket?: Deno.TcpConn): t.NetConnectResponse => {
    const error = !socket && lastErr ? Err.std(lastErr) : undefined;
    return { socket, error };
  };

  for (let i = 0; i < attempts; i += 1) {
    try {
      const socket = await Deno.connect({ hostname, port });
      return done(socket);
    } catch (err) {
      lastErr = err;
    }

    if (i < attempts - 1) {
      await Time.wait(currentDelay);
      currentDelay = Math.round(currentDelay * backoff);
    }
  }

  return done();
};
