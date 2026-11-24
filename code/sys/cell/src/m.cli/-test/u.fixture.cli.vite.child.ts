import { Time } from '../../-test.ts';

const [mode] = Deno.args;
if (mode === 'leaf') {
  const server = Deno.serve({ hostname: '127.0.0.1', port: 0, onListen: () => undefined }, () => {
    return new Response('owned');
  });
  Deno.addSignalListener('SIGTERM', () => void server.shutdown());
  console.info(`LEAF:${Deno.pid}:${server.addr.port}`);
  await server.finished;
} else {
  console.info(`OWNER:${Deno.pid}`);
  const leaf = new Deno.Command(Deno.execPath(), {
    args: ['run', '-P=test', import.meta.filename!, 'leaf'],
    stdin: 'null',
    stdout: 'inherit',
    stderr: 'inherit',
  }).spawn();
  let closing = false;
  const shutdown = () => {
    if (closing) Deno.exit(130); // Model Cell's second-interrupt escalation.
    closing = true;
    console.info('CLOSING');
    if (mode === 'leader-exit') Deno.exit(130); // Deliberately leave the owned leaf running.
    if (mode === 'delayed') {
      void (async () => {
        await Time.delay(500);
        leaf.kill('SIGTERM');
        await leaf.status;
        console.info('CLEAN');
        Deno.exit(130);
      })();
    }
  };
  Deno.addSignalListener('SIGINT', shutdown);
  Deno.addSignalListener('SIGTERM', shutdown);
  Deno.addSignalListener('SIGWINCH', () => console.info('RESIZED'));
  await leaf.status;
}
