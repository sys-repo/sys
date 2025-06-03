import type React from 'react';
import type { t } from '../common.ts';

/**
 * Library: Players
 */
export type PlayerLib = {
  Video: {
    signals: t.PlayerSignalsFactory;
    View: React.FC<t.VideoPlayerProps>;
    Element: React.FC<t.VideoElementProps
  };
  Timestamp: {
    Thumbnails: { View: React.FC<t.ThumbnailsProps> };
    Elapsed: { View: React.FC<t.ElapsedTimeProps> };
  };
};
