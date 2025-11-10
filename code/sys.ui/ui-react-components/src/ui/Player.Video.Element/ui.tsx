import React from 'react';
import { type t, D } from './common.ts';
import { VideoElement as Root } from './ui.VideoElement.tsx';

type E = HTMLVideoElement;
type P = t.VideoElementProps;

/**
 * Forwarded version of <VideoElement>.
 * Exposes the underlying <video> element ref.
 */
export const VideoElement = React.forwardRef<E, P>((props, ref) => {
  return <Root {...props} _externalRef={ref} />;
});
VideoElement.displayName = D.name;
