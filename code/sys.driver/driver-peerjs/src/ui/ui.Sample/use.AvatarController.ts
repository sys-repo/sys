import React from 'react';
import { type t, Media } from './common.ts';

/**
 * State controller for avatar video stream.
 */
export function useAvatarController(args: {
  stream?: MediaStream;
  name?: string;
  onSelect?: t.AvatarSelectHandler;
}) {
  const { name = 'Unknown' } = args;

  /**
   * Hooks:
   */
  const [stream, setStream] = React.useState<MediaStream | undefined>(args.stream);

  /**
   * Effects:
   */
  React.useEffect(() => setStream(args.stream), [args.stream?.id]);


  /**
   * Handlers:
   */
  const onReady: t.MediaVideoStreamReadyHandler = (e) => {
    setStream(e.stream.raw);

    console.info(`⚡️ [${name}].MediaStream.onReady:`, e);
    Media.Log.tracks(' • stream.raw:', e.stream.raw);
    Media.Log.tracks(' • stream.filtered:', e.stream.filtered);
  };

  const onSelect: t.AvatarSelectHandler = (e) => {
    args.onSelect?.(e);
  };

  /**
   * API:
   */
  return {
    stream,
    handlers: { onReady, onSelect },
  } as const;
}
