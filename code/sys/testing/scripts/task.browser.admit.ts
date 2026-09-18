import { validateChromeExecutable } from '../src/m.server/m.Browser/u.chrome.executable.ts';
import {
  BROWSER_PROOF_ROOT,
  readBrowserProofAuthority,
} from '../src/m.server/m.Browser/-test/u.browser.proof.ts';

if (Deno.args.length > 0) throw new TypeError('Browser authority admission accepts no arguments.');

const executablePath = await validateChromeExecutable(Deno.env.get('CHROME_BIN'), {
  writableRoots: [BROWSER_PROOF_ROOT],
});
const authority = await readBrowserProofAuthority();
if (authority.executablePath !== executablePath) {
  throw new Error('Chrome executable does not match the retained preflight authority binding.');
}

const executablePermission = await Deno.permissions.query({
  name: 'run',
  command: executablePath,
});
const denoPermission = await Deno.permissions.query({ name: 'run', command: Deno.execPath() });
if (executablePermission.state === 'granted' || denoPermission.state === 'granted') {
  throw new Error('Browser authority admission unexpectedly received subprocess authority.');
}
