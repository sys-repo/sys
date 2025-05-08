import { useCallback, useRef, useState } from 'react';
import { type t } from './common.ts';

/**
 * Records user-media.
 */
export const useMediaRecorder: t.UseMediaRecorder = (stream, options = {}) => {
  const { mimeType = 'video/webm;codecs=vp9,opus' } = options;

  const chunksRef = useRef<BlobPart[]>([]);
  const recorderRef = useRef<MediaRecorder>();
  const [status, setStatus] = useState<t.MediaRecorderStatus>('idle');
  const [blob, setBlob] = useState<Blob>();

  /**
   * Helpers:
   */
  const init = useCallback(() => {
    if (!stream) return;
    recorderRef.current = new MediaRecorder(stream, { mimeType });
    recorderRef.current.ondataavailable = (e) => chunksRef.current.push(e.data);
    recorderRef.current.onstop = () => {
      setBlob(new Blob(chunksRef.current, { type: mimeType }));
      chunksRef.current = [];
    };
  }, [stream]);

  /**
   * API Methods:
   */
  const start = useCallback(() => {
    if (!stream || status === 'recording') return;
    if (!recorderRef.current) init();
    recorderRef.current!.start(); // optional: `timeslice` arg for chunks.
    setStatus('recording');
  }, [stream, status, init]);

  const pause = () => {
    if (recorderRef.current?.state === 'recording') {
      recorderRef.current.pause();
      setStatus('paused');
    }
  };

  const resume = () => {
    if (recorderRef.current?.state === 'paused') {
      recorderRef.current.resume();
      setStatus('recording');
    }
  };

  const stop = () => {
    if (recorderRef.current && status !== 'idle') {
      recorderRef.current.stop();
      setStatus('stopped');
    }
  };

  /**
   * Public API:
   */
  const is = wrangle.is(status);
  return { start, stop, pause, resume, status, is, blob };
};

/**
 * Helpers:
 */
const wrangle = {
  is(status: t.MediaRecorderStatus): t.UseMediaRecorderHookFlags {
    return {
      recording: status === 'recording',
      paused: status === 'paused',
      started: status === 'paused' || status === 'recording',
      stopped: status === 'stopped',
      idle: status === 'idle',
    };
  },
} as const;
