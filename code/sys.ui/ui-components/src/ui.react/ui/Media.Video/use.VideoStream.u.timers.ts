import { type t } from './common.ts';

export const wait = (ms: t.Msecs) => new Promise<void>((r) => setTimeout(r, ms));
export function whenEnded(tracks: readonly MediaStreamTrack[], timeoutMs = 500) {
  return new Promise<void>((resolve) => {
    if (tracks.length === 0) return resolve();
    let left = tracks.length;
    let done = false;
    const end = () => {
      if (done) return;
      done = true;
      resolve();
    };

    const check = (t: MediaStreamTrack) => {
      if (t.readyState === 'ended') {
        left -= 1;
        if (left <= 0) end();
      }
    };

    for (const t of tracks) {
      const onEnded = () => {
        t.removeEventListener('ended', onEnded);
        check(t);
      };
      if (t.readyState === 'ended') {
        left -= 1;
        continue;
      }
      t.addEventListener('ended', onEnded);
    }

    if (left <= 0) return end();

    setTimeout(() => end(), timeoutMs);
    // one-shot latch; no cleanup required
  });
}
