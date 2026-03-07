import { afterEach, beforeEach, describe, expect, it } from '../../../-test.ts';
import { D } from '../common.ts';
import { createDebugSignals } from '../-spec/common.ts';

const STORAGE_KEY = `dev:${D.displayName}:media-playback`;
let restoreValue: string | null = null;

describe('ui.Driver.MediaPlayback/-u.debug', () => {
  beforeEach(() => {
    restoreValue = localStorage.getItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_KEY);
  });

  afterEach(() => {
    if (restoreValue === null) localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, restoreValue);
  });

  it('defaults muted to true and persists updates/reset', async () => {
    const debug = await createDebugSignals({ card: { defaultKind: 'playback-content' } });
    expect(debug.props.muted.value).to.eql(true);

    debug.props.muted.value = false;
    await Promise.resolve();
    expect(localStorage.getItem(STORAGE_KEY)).to.eql(JSON.stringify({ muted: false }));

    debug.reset();
    await Promise.resolve();
    expect(debug.props.muted.value).to.eql(true);
    expect(localStorage.getItem(STORAGE_KEY)).to.eql(JSON.stringify({ muted: true }));
  });
});
