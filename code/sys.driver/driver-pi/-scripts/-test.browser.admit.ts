import { Fs } from '@sys/fs';
import { Browser } from '@sys/testing/server';

if (Deno.args.length > 0) {
  throw new TypeError('Driver Pi browser executable admission accepts no arguments.');
}

const cwd = Fs.Path.fromFileUrl(new URL('../', import.meta.url));
const writableRoot = Fs.resolve(cwd, '.tmp');
const executablePath = await Browser.Executable.admit(Deno.env.get('CHROME_BIN'), {
  writableRoots: [writableRoot],
});

const executablePermission = await Deno.permissions.query({
  name: 'run',
  command: executablePath,
});
const denoPermission = await Deno.permissions.query({ name: 'run', command: Deno.execPath() });
if (executablePermission.state === 'granted' || denoPermission.state === 'granted') {
  throw new Error('Driver Pi browser admission unexpectedly received subprocess authority.');
}

console.info(`Driver Pi browser executable admission: ${executablePath}`);
