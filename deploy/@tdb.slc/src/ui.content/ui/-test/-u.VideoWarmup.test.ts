import { describe, expect, it } from '../../../-test.ts';
import { afterEach, beforeEach, DomMock, Testing } from '@sys/testing/server';
import { VIDEO } from '../../-VIDEO.ts';
import { Http } from '../common.ts';
import { VideoWarmup } from '../u.VideoWarmup.ts';
import { Programme } from '../../ui.Programme/mod.ts';

describe('VideoWarmup', () => {
  beforeEach(() => DomMock.polyfill());
  afterEach(() => DomMock.unpolyfill());

  const programmeMedia = () =>
    ({ children: Programme.Media.children() }) as Parameters<typeof VideoWarmup.programmeIntro>[0];

  const installServiceWorker = () => {
    const originalNavigator = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
    const serviceWorker = {
      controller: {},
      ready: Promise.resolve({}),
      addEventListener() {},
      removeEventListener() {},
    };

    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      value: globalThis.window.navigator,
    });
    Object.defineProperty(globalThis.navigator, 'serviceWorker', {
      configurable: true,
      value: serviceWorker,
    });

    return () => {
      if (originalNavigator) {
        Object.defineProperty(globalThis, 'navigator', originalNavigator);
      } else {
        delete (globalThis as { navigator?: Navigator }).navigator;
      }
    };
  };

  it('landing returns trailer and overview urls', () => {
    expect(VideoWarmup.landing()).to.eql([VIDEO.Trailer.src, VIDEO.Overview.src]);
  });

  it('programmeIntro returns the first playable item from each top-level section', () => {
    const media = programmeMedia();
    expect(VideoWarmup.programmeIntro(media)).to.eql([
      VIDEO.Programme.Intro.About.src,
      VIDEO.Programme.Model.Customer.Entry.src,
      VIDEO.Programme.Model.Impact.Entry.src,
      VIDEO.Programme.Model.Economic.Entry.src,
      VIDEO.Programme.KeyMetrics.src,
      VIDEO.Programme.Conclusion.src,
    ]);
  });

  it('section excludes the first playable item for the selected section', () => {
    const media = Programme.Media.children()[1];
    expect(VideoWarmup.section(media)).to.eql([
      VIDEO.Programme.Model.Customer.Customers.src,
      VIDEO.Programme.Model.Customer.Segments.src,
      VIDEO.Programme.Model.Customer.EarlyAdopters.src,
      VIDEO.Programme.Model.Customer.Jobs.src,
      VIDEO.Programme.Model.Customer.Alternatives.src,
      VIDEO.Programme.Model.Customer.UVP.src,
      VIDEO.Programme.Model.Customer.Solution.src,
    ]);
  });

  it('preempts overlapping warm batches while service worker control is pending', async () => {
    const originalNavigator = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
    const originalWarm = Http.Preload.warm;
    const listeners = new Map<EventListenerOrEventListenerObject, EventListener>();
    const warmed: string[] = [];
    const serviceWorker: {
      controller: object | null;
      ready: Promise<object>;
      addEventListener(type: string, fn: EventListenerOrEventListenerObject): void;
      removeEventListener(type: string, fn: EventListenerOrEventListenerObject): void;
    } = {
      controller: null as object | null,
      ready: Promise.resolve({}),
      addEventListener(type: string, fn: EventListenerOrEventListenerObject) {
        if (type !== 'controllerchange') return;
        const handler = typeof fn === 'function' ? fn : fn.handleEvent.bind(fn);
        listeners.set(fn, handler);
      },
      removeEventListener(type: string, fn: EventListenerOrEventListenerObject) {
        if (type !== 'controllerchange') return;
        listeners.delete(fn);
      },
    };

    const fireControllerChange = () => {
      serviceWorker.controller = {};
      [...listeners.values()].forEach((fn) => fn(new Event('controllerchange')));
    };

    try {
      Object.defineProperty(globalThis, 'navigator', {
        configurable: true,
        value: globalThis.window.navigator,
      });
      Object.defineProperty(globalThis.navigator, 'serviceWorker', {
        configurable: true,
        value: serviceWorker,
      });

      (Http.Preload as { warm: typeof Http.Preload.warm }).warm = async (input) => {
        const ops = Array.isArray(input) ? input : [input];
        warmed.push(
          ...ops.map((item) => typeof item === 'string' ? item : item.url),
        );
        return {
          ok: true,
          ops: ops.map((item) => ({
            ok: true,
            status: 200,
            bytes: 1,
            range: typeof item === 'string' ? undefined : item.range,
            url: typeof item === 'string' ? item : item.url,
          })),
        };
      };

      const href = new URL('../m.VideoWarmup.ts', import.meta.url).href;
      const { WarmVideo } = await import(`${href}?v=${Testing.slug()}`);
      const media = programmeMedia();

      const landing = WarmVideo.landing();
      const programme = WarmVideo.programmeIntro(media);

      await Testing.wait();
      fireControllerChange();
      await Promise.all([landing, programme]);

      expect(warmed).to.not.include(VIDEO.Trailer.src);
      expect(warmed).to.not.include(VIDEO.Overview.src);
      expect(warmed).to.include(VIDEO.Programme.Intro.About.src);
    } finally {
      (Http.Preload as { warm: typeof Http.Preload.warm }).warm = originalWarm;

      if (originalNavigator) {
        Object.defineProperty(globalThis, 'navigator', originalNavigator);
      } else {
        delete (globalThis as { navigator?: Navigator }).navigator;
      }
    }
  });

  it('does not mark urls completed unless the full media cache is confirmed ready', async () => {
    const restoreNavigator = installServiceWorker();
    const originalWarm = Http.Preload.warm;
    const warmed: string[] = [];

    try {
      (Http.Preload as { warm: typeof Http.Preload.warm }).warm = async (input) => {
        const ops = Array.isArray(input) ? input : [input];
        warmed.push(...ops.map((item) => typeof item === 'string' ? item : item.url));
        return {
          ok: true,
          ops: ops.map((item) => ({
            ok: true,
            status: 206,
            bytes: 1,
            range: typeof item === 'string' ? undefined : item.range,
            url: typeof item === 'string' ? item : item.url,
            fullMediaCached: false,
          })),
        };
      };

      const href = new URL('../m.VideoWarmup.ts', import.meta.url).href;
      const { WarmVideo } = await import(`${href}?v=${Testing.slug()}`);

      await WarmVideo.landing();
      await WarmVideo.landing();

      expect(warmed).to.eql([
        VIDEO.Trailer.src,
        VIDEO.Overview.src,
        VIDEO.Trailer.src,
        VIDEO.Overview.src,
      ]);
    } finally {
      (Http.Preload as { warm: typeof Http.Preload.warm }).warm = originalWarm;
      restoreNavigator();
    }
  });
});
