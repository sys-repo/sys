import { type t, Time } from './common.ts';
import { collectBrowserErrors } from './u.chrome.errors.ts';
import {
  attachChromeTarget,
  enableChromeTarget,
  navigateChromeTarget,
} from './u.chrome.protocol.ts';
import { openChromeSession } from './u.chrome.session.ts';

const DEFAULT_WAIT_AFTER_LOAD = 750;

export async function loadChrome(
  url: string,
  options: t.Browser.Load.Options = {},
): Promise<t.Browser.Load.Result> {
  const browser: t.Browser.Kind = 'Chrome';
  const executablePath = options.executablePath;
  const waitAfterLoad = options.waitAfterLoad ?? DEFAULT_WAIT_AFTER_LOAD;
  const allowError = options.allowError;
  const session = await openChromeSession({ executablePath });
  const errors: string[] = [];
  let diagnosticsOpen = true;
  let result: t.Browser.Load.Result | undefined;
  let primary: unknown;

  try {
    const target = await attachChromeTarget(session.cdp);
    const collect = collectBrowserErrors(errors, target.sessionId);
    session.cdp.on((message) => {
      if (diagnosticsOpen) collect(message);
    });
    await enableChromeTarget(session.cdp, target.sessionId);
    await navigateChromeTarget(session.cdp, target.sessionId, target.mainFrameId, url);
    await Time.wait(waitAfterLoad);

    await Time.wait(0);
    diagnosticsOpen = false;
    const fatal = allowError ? errors.filter((text) => !allowError(text)) : errors;
    result = Object.freeze({
      ok: fatal.length === 0,
      url,
      browser,
      executablePath: session.executablePath,
      errors: Object.freeze([...fatal]),
      stderr: session.stderr(),
    });
  } catch (cause) {
    primary = cause;
  }

  if (primary !== undefined) result = undefined;
  await session.close(primary);
  if (!result) throw new Error('Browser.load settled without result evidence.');
  return result;
}
