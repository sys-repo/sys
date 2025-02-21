// @ts-types="@types/react"
import React from 'react';

import '@sys/tmp/sample-imports';
// import { Foo } from '@sys/tmp/ui';

export const DEFAULTS = {
  src: 'vimeo/499921561', // Tubes.
} as const;

export type VideoProps = {
  title?: string;
  src?: string;
};

/**
 * Component
 */
export const Video: React.FC<VideoProps> = (props: VideoProps) => {
  const src = props.src || DEFAULTS.src;
  return (
    <div>
      <code>{`🐷 TODO | import { Foo } from '@sys/tmp/ui';`}</code>
      {/* <Foo />
      <VideoPlayer src={src} /> */}
    </div>
  );
};
