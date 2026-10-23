import { forwardRef } from 'react';
import { type t } from './common.ts';
import { VideoElementImpl } from './ui.VideoElement.impl.tsx';

/**
 * Public Video component.
 *
 * Exposes a VideoElementHandle (not the raw <video> element).
 */
export const VideoElement = forwardRef<t.VideoElementHandle, t.VideoElementProps>(
  function Video(props, ref) {
    return <VideoElementImpl {...props} _externalRef={ref} />;
  },
);
