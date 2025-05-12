import { useCallback, useEffect, useRef, useState } from 'react';
import { type t } from './common.ts';

/**
 * Hook: Manages a standard [MediaRecorder] video/audio stream recorder.
 *       Camera/Mic → (request:constraints) → 💦 → Binary (File).
 *
 *       W3C:Ref:
 *          https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder
 */
export const useMediaRecorder: t.UseMediaRecorder = (stream, options = {}) => {
  const chunksRef = useRef<BlobPart[]>([]);
  const recorderRef = useRef<MediaRecorder>();
  const optionsRef = useRef<t.UseMediaRecorderOptions>(options);
  const stopResolversRef = useRef<((e: t.MediaRecorderHookStopped) => void)[]>([]);

  const [status, setStatus] = useState<t.MediaRecorderStatus>('Idle');
  const [bytes, setBytes] = useState(0);
  const [blob, setBlob] = useState<Blob>();

  /**
   * Effects:
   */
  useEffect(() => {
    optionsRef.current = options; // Keep refs in sync.
  }, [options]);

  /**
   * Helpers:
   */
  const init = useCallback(() => {
    if (!stream) return;
    const mimeType = optionsRef.current.mimeType ?? 'video/webm;codecs=vp9,opus';
    const recorder = (recorderRef.current = new MediaRecorder(stream, { mimeType }));
    recorder.ondataavailable = (e) => {
      const bytes = e.data.size;
      chunksRef.current.push(e.data);
      setBytes((n) => n + bytes);
    };
    recorder.onstop = () => {
      const type = mimeType;
      const blob = new Blob(chunksRef.current, { type });
      const bytes = blob.size;
      const res: t.MediaRecorderHookStopped = { blob, bytes };
      setBytes(bytes);
      setBlob(blob);

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
    setBytes(0);
    recorderRef.current!.start(250);
    setStatus('Recording');
  };

  const pause = () => {
    if (recorderRef.current?.state === 'recording') {
      recorderRef.current.pause();
      setStatus('Paused');
    }
  };

  const resume = () => {
    if (recorderRef.current?.state === 'paused') {
      recorderRef.current.resume();
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
} as const;
