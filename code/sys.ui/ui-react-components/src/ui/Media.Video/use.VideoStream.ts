import { useEffect, useMemo, useState } from 'react';

import { type t, AspectRatio, D, Err, Is, logMedia, Obj, Rx } from './common.ts';
import { getStream } from './u.getStream.ts';

export const useVideoStream: t.UseVideoStream = (streamOrConstraints, options = {}) => {
  const { filter } = options;

  /**
   * Memoised inputs.
   */
  const deps = [Is.mediaStream(streamOrConstraints) ? 0 : Obj.hash(streamOrConstraints)];
  const input = {
    constraints: useMemo<MediaStreamConstraints | undefined>(() => {
      if (Is.mediaStream(streamOrConstraints)) return undefined;
      return streamOrConstraints ?? D.constraints;
    }, deps),
    stream: useMemo<MediaStream | undefined>(() => {
      return Is.mediaStream(streamOrConstraints) ? streamOrConstraints : undefined;
    }, deps),
  } as const;

  const zoom = useMemo<Partial<t.MediaZoomValues> | undefined>(
    () => options.zoom,
    [Obj.hash(options.zoom)],
  );

  /**
   * Hooks:
   */
  const [ready, setReady] = useState(false);
  const [filtered, setFiltered] = useState<MediaStream>();
  const [raw, setRaw] = useState<MediaStream>();
  const [error, setError] = useState<t.StdError>();
  const [aspectRatio, setAspectRatio] = useState<string>('');
  const [deviceChangeBump, setDeviceChangeBump] = useState(0);

  /**
   * Effect: Bump state to re-run acquisition on `devicechange`:
   */
  useEffect(() => {
    const life = Rx.abortable();
    const { signal } = life;
    const onChange = () => setDeviceChangeBump((n) => n + 1);

    // Attach listener if supported:
    if (navigator?.mediaDevices?.addEventListener) {
      navigator.mediaDevices.addEventListener('devicechange', onChange, { signal });
    } else if ('ondevicechange' in (navigator?.mediaDevices ?? {})) {
      // Safari fallback:
      const setHandler = (fn: (() => void) | null) => (navigator.mediaDevices.ondevicechange = fn);
      setHandler(onChange);
      navigator.mediaDevices.ondevicechange = onChange;
      signal.addEventListener('abort', () => setHandler(null), { signal });
    }

    return life.dispose;
  }, []);

  /**
   * Effect: acquire / transform stream.
   */
  useEffect(() => {
    const life = Rx.lifecycle();

    async function run() {
      try {
        const res = await getStream(input.stream ?? input.constraints, { filter, zoom });
        logMedia('✅ stream acquired', {
          audioTracks: res.raw.getAudioTracks().map((a) => a.label),
          videoTracks: res.raw.getVideoTracks().map((v) => v.label),
        });
        if (life.disposed) return;

        const merged = withAudio(res.raw, res.filtered);

        setRaw(res.raw);
        setFiltered(merged);
        setAspectRatio(AspectRatio.toString(merged));
        setReady(true);
      } catch (err) {
        logMedia('❌ stream error', err);
        console.error(err);
        if (!life.disposed) setError(Err.std(err));
      }
    }

    run();
    return () => {
      logMedia('🧹 cleaning up stream (stopping tracks)');
      filtered?.getTracks().forEach((t) => t.stop());
      setReady(false);
      life.dispose();
    };
  }, [input.constraints, input.stream, filter, zoom, deviceChangeBump]);

  /**
   * API:
   */
  const api: t.VideoStreamHook = {
    ready,
    get stream() {
      return { raw, filtered: ready ? filtered : undefined };
    },
    aspectRatio,
    error,
  };
  return api;
};

/**
 * Helpers:
 */
const withAudio = (origin: MediaStream, target: MediaStream): MediaStream => {
  if (target.getAudioTracks().length === 0) {
    origin.getAudioTracks().forEach((t) => target.addTrack(t.clone()));
  }
  return target;
};
