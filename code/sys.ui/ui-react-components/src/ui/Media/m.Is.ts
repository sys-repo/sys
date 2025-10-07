import { type t } from './common.ts';

export const Is: t.MediaIsLib = {
  mediaStream(input?: unknown): input is MediaStream {
    return typeof MediaStream === 'function'
      ? input instanceof MediaStream
      : !!input && typeof input === 'object' && 'getTracks' in input;
  },

  constraints(input?: unknown): input is MediaStreamConstraints {
    return (
      !!input &&
      typeof input === 'object' &&
      !Is.mediaStream(input) &&
      ('audio' in input || 'video' in input)
    );
  },
};
