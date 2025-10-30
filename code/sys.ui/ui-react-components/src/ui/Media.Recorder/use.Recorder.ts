import { useCallback, useEffect, useRef, useState } from 'react';

import { type t, Is, logInfo } from './common.ts';
import { captureInfo } from './u.captureInfo.ts';
import { createMediaRecorder } from './u.createMediaRecorder.ts';
import { useElapsedTimer } from './use.Recorder.elapsed.ts';

/**
 * Hook: Manages a standard [MediaRecorder] video/audio stream recorder.
 *       Camera/Mic → (request:constraints) → 💦 → Binary (File).
 *
 *       W3C:Ref:
 *          https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder
 */
export const useRecorder: t.UseMediaRecorder = (stream, options = {}) => {
  const { onStatusChange } = options;

  /**
   * Refs:
   */
  const chunksRef = useRef<BlobPart[]>([]);
  const recorderRef = useRef<MediaRecorder>(undefined);
  const optionsRef = useRef<t.MediaRecorderOptions>(options);
  const onStatusChangeRef = useRef<t.MediaRecorderStatusHandler>(undefined);
  const stopResolversRef = useRef<((e: t.MediaRecorderHookStopped) => void)[]>([]);

  const [state, setState] = useState<t.MediaRecorderState>('Idle');
  const [bytes, setBytes] = useState(0);
  const [blob, setBlob] = useState<Blob>();
  const timer = useElapsedTimer();

  /** Bitrates (bps). Kept even when recorder is torn down, for stable status reporting. */
  const vbpsRef = useRef<number>(0);
  const abpsRef = useRef<number>(0);
  const captureRef = useRef<t.MediaRecorderCapture>({});

  /**
   * Effects: Keep refs in-sync.
   */
  useEffect(() => void (optionsRef.current = options), [options]);
  useEffect(() => void (onStatusChangeRef.current = onStatusChange), [onStatusChange]);

  /**
   * Effect: fire status events.
   */
  useEffect(() => {
    const cb = onStatusChangeRef.current;
    cb?.({
      state,
      elapsed: timer.elapsed,
      is: wrangle.is(state),
      bytes: is.started ? bytes : (blob?.size ?? 0),
      bitrate: { video: vbpsRef.current, audio: abpsRef.current },
      capture: captureRef.current,
      mimeType: recorderRef.current?.mimeType ?? '',
    });
  }, [state, bytes, blob, timer.elapsed]);

  /**
   * Helper: Recorder API.
   */
  const init = useCallback(() => {
    if (!stream) return;

    const opts = optionsRef.current;
    const recorder = (recorderRef.current = createMediaRecorder(stream, opts));

    const toBitrate = (v: number, defaultValue: number = 0) => (Is.number(v) ? v : defaultValue);
    vbpsRef.current = toBitrate(recorder.videoBitsPerSecond, opts.videoBitsPerSecond);
    abpsRef.current = toBitrate(recorder.audioBitsPerSecond, opts.audioBitsPerSecond);
    captureRef.current = captureInfo(stream);

    logInfo('✨ created MediaRecorder');
    logInfo(`- bitrate:video: ${recorder.videoBitsPerSecond / 1_000_000} Mbps`);
    logInfo(`- bitrate:audio: ${recorder.audioBitsPerSecond / 1_000} kbps`);
    logInfo('- stream:capture', captureRef.current);

    recorder.ondataavailable = (e) => {
      const bytes = e.data.size;
      chunksRef.current.push(e.data);
      setBytes((n) => n + bytes);
    };
    recorder.onstop = () => {
      const type = recorder.mimeType;
      const blob = new Blob(chunksRef.current, { type });
      const bytes = blob.size;
      const res: t.MediaRecorderHookStopped = { blob, bytes };
      setBlob(blob);
      setBytes(bytes);

      // Resolve "stop" promise callbacks.
      stopResolversRef.current.forEach((resolve) => resolve(res));

      // Reset state.
      stopResolversRef.current = [];
      chunksRef.current = [];
      recorderRef.current = undefined;
    };
  }, [stream]);

  /**
   * API Methods:
   */
  const start = () => {
    if (!stream || state === 'Recording') return api;
    if (!recorderRef.current) init();

    timer.reset(); // fresh run
    timer.begin(); // start ticking while recording

    setBytes(0);
    recorderRef.current!.start(250);
    setState('Recording');
  };

  const pause = () => {
    if (recorderRef.current?.state === 'recording') {
      recorderRef.current.pause();
      timer.end(true); // accumulate elapsed up to pause; stop ticking
      setState('Paused');
    }
  };

  const resume = () => {
    if (recorderRef.current?.state === 'paused') {
      recorderRef.current.resume();
      timer.begin();
      setState('Recording');
    }
  };

  const stop = () => {
    type R = t.MediaRecorderHookStopped;
    if (!recorderRef.current || state === 'Idle') {
      return Promise.resolve<R>({ blob: undefined, bytes: 0 });
    } else {
      return new Promise<R>((resolve) => {
        stopResolversRef.current.push(resolve);
        recorderRef.current?.stop();
        timer.end(true); // ← accumulate: fold in any remaining active segment.
        setState('Stopped');
      });
    }
  };

  const reset = async () => {
    if (recorderRef.current) await stop();
    timer.reset();

    // Refs:
    chunksRef.current = [];
    stopResolversRef.current = [];
    recorderRef.current = undefined;
    vbpsRef.current = 0;
    abpsRef.current = 0;
    captureRef.current = {};

    // State:
    setState('Idle');
    setBlob(undefined);
    setBytes(0);
  };

  /**
   * Public API:
   */
  const is = wrangle.is(state);
  const api: t.MediaRecorderHook = {
    state,
    is,
    get bytes() {
      if (is.started) return bytes;
      return blob?.size ?? 0;
    },
    get elapsed() {
      return timer.elapsed;
    },
    get bitrate() {
      return { video: vbpsRef.current, audio: abpsRef.current };
    },
    get capture() {
      return captureRef.current;
    },
    blob,
    start,
    stop,
    pause,
    resume,
    reset,
  };
  return api;
};

/**
 * Helpers:
 */
const wrangle = {
  is(status: t.MediaRecorderState): t.MediaRecorderHookFlags {
    return {
      idle: status === 'Idle',
      recording: status === 'Recording',
      paused: status === 'Paused',
      started: status === 'Paused' || status === 'Recording',
      stopped: status === 'Stopped',
    };
  },
} as const;
