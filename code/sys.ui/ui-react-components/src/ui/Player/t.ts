import type React from 'react';
import type { t } from '../common.ts';

/**
 * Library: Players
 */
export type PlayerLib = {
  Video: {
    View: React.FC<t.VideoPlayerProps>;
    signals: t.PlayerSignalsFactory;
  };
  Timestamp: {
    Thumbnails: { View: React.FC<t.ThumbnailsProps> };
    Elapsed: { View: React.FC<t.ElapsedTimeProps> };
  };
};
