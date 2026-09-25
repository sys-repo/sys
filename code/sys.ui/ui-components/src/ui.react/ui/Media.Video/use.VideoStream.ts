import { useEffect, useMemo, useRef, useState } from 'react';
import { type t, AspectRatio, D, Err, Is, logInfo, Obj, Rx, Try } from './common.ts';
import { getStream } from './u.getStream.ts';
import {
  applyVirtualConstraintsIfNeeded,
  attachTelemetry,
  detachTelemetry,
  isVirtualLabel,
  singleFlight,
  wait,
  warmAudio,
  whenEnded,
  withAudio,
} from './use.VideoStream.u.ts';

type VideoInput = {
  readonly constraints?: MediaStreamConstraints;
  readonly stream?: MediaStream;
};

export const useVideoStream: t.UseVideoStream = (streamOrConstraints, options = {}) => {
  const { filter } = options;

  /**
   * Hooks:
   */
  const deps = [Is.mediaStream(streamOrConstraints) ? 0 : Obj.hash(streamOrConstraints)];
  const input = useMemo(() => resolveVideoInput(streamOrConstraints, D.constraints), deps);
  const zoom = useMemo<Partial<t.MediaZoomValues> | undefined>(
    () => options.zoom,
    [Obj.hash(options.zoom)],
  );

  // State:
  const [ready, setReady] = useState(false);
  const [filtered, setFiltered] = useState<MediaStream>();
  const [raw, setRaw] = useState<MediaStream>();
  const [error, setError] = useState<t.StdError>();
  const [aspectRatio, setAspectRatio] = useState<string>('');
  const [deviceChangeBump, setDeviceChangeBump] = useState(0);
  const [retryBump, setRetryBump] = useState(0); // drives non-recursive retry

  // Refs:
  const telemetryRef = useRef<MediaStream | undefined>(undefined);

  useEffect(() => {
    const life = Rx.abortable();
    const { signal } = life;
    const onChange = () => setDeviceChangeBump((n) => n + 1);

    if (navigator?.mediaDevices?.addEventListener) {
      navigator.mediaDevices.addEventListener('devicechange', onChange, { signal });
    } else if ('ondevicechange' in (navigator?.mediaDevices ?? {})) {
      const setHandler = (fn: (() => void) | null) => (navigator.mediaDevices.ondevicechange = fn);
      setHandler(onChange);
      navigator.mediaDevices.ondevicechange = onChange;
      signal.addEventListener('abort', () => setHandler(null));
    }

    return life.dispose;
  }, []);

  useEffect(() => {
    const life = Rx.lifecycle();
    const gen = Symbol('acquire');
    let currentGen = gen;

    async function acquireOnce(): Promise<void> {
      await singleFlight(async () => {
        // Teardown previous (keeps device free for next acquire)
        const allOld = [...(filtered?.getTracks() ?? []), ...(raw?.getTracks() ?? [])];
        for (const t of allOld) {
          Try.run(() => t.stop()); // sync; safe to fire without await
        }
        await whenEnded(allOld, 600);
        await wait(40);

        const res = await getStream(input.stream ?? input.constraints, { filter, zoom });
        if (life.disposed || currentGen !== gen) return;

        logInfo('✅ stream acquired', {
          audioTracks: res.raw.getAudioTracks().map((a) => a.label),
          videoTracks: res.raw.getVideoTracks().map((v) => v.label),
        });

        const merged = withAudio(res.raw, res.filtered);
        attachTelemetry(merged);
        telemetryRef.current = merged;

        await applyVirtualConstraintsIfNeeded(merged);
        await warmAudio(merged);

        setRaw(res.raw);
        setFiltered(merged);
        setAspectRatio(AspectRatio.toString(merged));
        setReady(true);

        // Watchdog (non-recursive): only for *virtual* mics. Physical mics may unmute later.
        await Try.run(async () => {
          const [track] = merged.getAudioTracks();
          if (!track) return;

          let unmuted = !track.muted;
          const onUnmute = () => (unmuted = true);
          track.addEventListener('unmute', onUnmute, { once: true });
          await wait(220); // ← Allow a beat for virtuals to announce.
          track.removeEventListener('unmute', onUnmute);

          const looksVirtual = isVirtualLabel(track.label || '');
          if (!unmuted && looksVirtual && currentGen === gen && !life.disposed) {
            logInfo('🔁 audio still muted; scheduling retry for virtual device');
            setRetryBump((n) => n + 1); // ← Trigger a fresh acquire.
          }
        });
      });
    }

    Try.run(acquireOnce).then((runResult) => {
      runResult.catch((error) => {
        logInfo('❌ stream error', error);
        console.error(error);
        if (!life.disposed) setError(Err.std(error));
      });
    });

    return () => {
      currentGen = Symbol('stale');

      // Remove telemetry first:
      detachTelemetry(telemetryRef.current);
      telemetryRef.current = undefined;

      logInfo('🫧 cleaning up stream (stopping tracks)');
      const tracks: MediaStreamTrack[] = [
        ...(filtered?.getTracks() ?? []),
        ...(raw?.getTracks() ?? []),
      ];
      for (const t of tracks) {
        Try.run(() => t.stop());
      }

      setReady(false);
      life.dispose();
    };
  }, [input.constraints, input.stream, filter, zoom, deviceChangeBump, retryBump]);

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
function resolveVideoInput(
  value: MediaStream | MediaStreamConstraints | undefined,
  defaults: MediaStreamConstraints,
): VideoInput {
  if (Is.mediaStream(value)) return { stream: value };
  return { constraints: value ?? defaults };
}
