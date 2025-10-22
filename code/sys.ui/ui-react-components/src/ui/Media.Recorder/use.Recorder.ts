import { useCallback, useEffect, useRef, useState } from 'react';

import { type t, Is, logInfo } from './common.ts';
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

  const chunksRef = useRef<BlobPart[]>([]);
  const recorderRef = useRef<MediaRecorder>(undefined);
  const optionsRef = useRef<t.MediaRecorderOptions>(options);
  const stopResolversRef = useRef<((e: t.MediaRecorderHookStopped) => void)[]>([]);

  const [status, setStatus] = useState<t.MediaRecorderStatus>('Idle');
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

  /**
   * Effect: fire status events.
   */
  useEffect(() => {
    if (!onStatusChange) return;
    const is = wrangle.is(status);
    onStatusChange({
      status,
      elapsed: timer.elapsed,
      is: wrangle.is(status),
      bytes: is.started ? bytes : (blob?.size ?? 0),
      bitrate: { video: vbpsRef.current, audio: abpsRef.current },
      capture: captureRef.current,
    });
  }, [onStatusChange, status, bytes, blob, timer.elapsed]);

  /**
   * Helper: Recorder API.
   */
  const init = useCallback(() => {
    if (!stream) return;

    const opts = optionsRef.current;
    const recorder = (recorderRef.current = createMediaRecorder(stream, opts));

    logInfo('✨ created MediaRecorder');
    logInfo(`- bitrate:video: ${recorder.videoBitsPerSecond / 1_000_000} Mbps`);
    logInfo(`- bitrate:audio: ${recorder.audioBitsPerSecond / 1_000} kbps`);
    logInfo('- stream:capture', wrangle.capture(stream));

    const toBitrate = (v: number, defaultValue: number = 0) => (Is.number(v) ? v : defaultValue);
    vbpsRef.current = toBitrate(recorder.videoBitsPerSecond, opts.videoBitsPerSecond);
    abpsRef.current = toBitrate(recorder.audioBitsPerSecond, opts.audioBitsPerSecond);
    captureRef.current = wrangle.capture(stream);

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
    if (!stream || status === 'Recording') return api;
    if (!recorderRef.current) init();

    timer.reset(); // fresh run
    timer.begin(); // start ticking while recording

    setBytes(0);
    recorderRef.current!.start(250);
    setStatus('Recording');
  };

  const pause = () => {
    if (recorderRef.current?.state === 'recording') {
      recorderRef.current.pause();
      timer.end(true); // accumulate elapsed up to pause; stop ticking
      setStatus('Paused');
    }
  };

  const resume = () => {
    if (recorderRef.current?.state === 'paused') {
      recorderRef.current.resume();
      timer.begin();
      setStatus('Recording');
    }
  };

  const stop = () => {
    type R = t.MediaRecorderHookStopped;
    if (!recorderRef.current || status === 'Idle') {
      return Promise.resolve<R>({ blob: undefined, bytes: 0 });
    } else {
      return new Promise<R>((resolve) => {
        stopResolversRef.current.push(resolve);
        recorderRef.current?.stop();
        timer.end(true); // ← accumulate: fold in any remaining active segment.
        setStatus('Stopped');
      });
    }
  };

  const reset = async () => {
    if (recorderRef.current) await stop();

    chunksRef.current = [];
    stopResolversRef.current = [];
    recorderRef.current = undefined;
    setStatus('Idle');
    setBlob(undefined);
    setBytes(0);
    vbpsRef.current = 0;
    abpsRef.current = 0;
    captureRef.current = {};

    timer.reset();
  };

  /**
   * Public API:
   */
  const is = wrangle.is(status);
  const api: t.MediaRecorderHook = {
    status,
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
  is(status: t.MediaRecorderStatus): t.MediaRecorderHookFlags {
    return {
      idle: status === 'Idle',
      recording: status === 'Recording',
      paused: status === 'Paused',
      started: status === 'Paused' || status === 'Recording',
      stopped: status === 'Stopped',
    };
  },

  capture(stream: MediaStream): t.MediaRecorderCapture {
    const s = stream.getVideoTracks?.()[0]?.getSettings?.() ?? {};
    return {
      width: s.width,
      height: s.height,
      frameRate: s.frameRate,
      aspectRatio: s.aspectRatio,
    };
  },
} as const;
