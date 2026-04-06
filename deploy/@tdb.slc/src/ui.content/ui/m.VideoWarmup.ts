import { type t, Http, Rx } from './common.ts';
import { VideoWarmup } from './u.VideoWarmup.ts';

type WarmBatch = {
  readonly priority: number;
  readonly life: ReturnType<typeof Rx.abortable>;
  readonly promise: Promise<void>;
};

const P = {
  landing: 1,
  programme: 2,
  section: 3,
} as const;

const completed = new Set<string>();
let current: WarmBatch | undefined;

export const WarmVideo = {
  landing() {
    return run(VideoWarmup.landing(), P.landing);
  },

  programmeIntro(media?: t.VideoMediaContent) {
    return run(VideoWarmup.programmeIntro(media), P.programme);
  },

  section(media?: t.VideoMediaContent) {
    return run(VideoWarmup.section(media), P.section);
  },
} as const;

async function run(urls: readonly string[], priority: number) {
  if (typeof window === 'undefined') return;

  const pending = urls.filter((url) => !!url && !completed.has(url));
  if (!pending.length) return;

  if (current) {
    if (current.priority > priority) return current.promise;
    current.life.dispose();
    await current.promise.catch(() => {});
  }

  const life = Rx.abortable();
  const promise = (async () => {
    const controlled = await whenServiceWorkerControls();
    if (!controlled) return;
    if (life.disposed || current?.life !== life) return;

    for (const url of pending) {
      if (life.disposed) break;
      if (current?.life !== life) break;
      if (completed.has(url)) continue;

      const result = await Http.Preload.warm(
        [{ url, range: { start: 0, end: 0 } }],
        { concurrency: 1, until: life.dispose$ },
      );

      if (life.disposed) break;
      if (current?.life !== life) break;
      if (result.ok && result.ops.every((op) => op.ok && op.fullMediaCached === true)) {
        completed.add(url);
      }
    }
  })().catch((err) => {
    if (life.disposed) return;
    throw err;
  }).finally(() => {
    if (current?.life === life) current = undefined;
  });

  current = { priority, life, promise };
  return promise;
}

async function whenServiceWorkerControls() {
  if (typeof navigator === 'undefined') return false;
  if (!('serviceWorker' in navigator)) return false;
  if (navigator.serviceWorker.controller) return true;

  try {
    await navigator.serviceWorker.ready;
  } catch {
    return false;
  }

  if (navigator.serviceWorker.controller) return true;

  return await new Promise<boolean>((resolve) => {
    let doneCalled = false;
    const handler = () => done(!!navigator.serviceWorker.controller);
    const done = (value: boolean) => {
      if (doneCalled) return;
      doneCalled = true;
      clearTimeout(timeout);
      navigator.serviceWorker.removeEventListener('controllerchange', handler);
      resolve(value);
    };

    const timeout = window.setTimeout(() => done(!!navigator.serviceWorker.controller), 1500);
    navigator.serviceWorker.addEventListener('controllerchange', handler, { once: true });
  });
}
