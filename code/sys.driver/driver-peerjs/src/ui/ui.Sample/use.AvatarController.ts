import React from 'react';
import { type t, Kbd, Media } from './common.ts';

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
  const [flipped, setFlipped] = React.useState(false);

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
    if (Kbd.Is.commandConcept(e.modifiers)) setFlipped((prev) => !prev);
    if (!Kbd.Is.modified(e.modifiers) && !flipped) {
      args.onSelect?.(e);
    }
  };

  /**
   * API:
   */
  return {
    handlers: { onReady, onSelect },
    stream,
    flipped,
  } as const;
}
