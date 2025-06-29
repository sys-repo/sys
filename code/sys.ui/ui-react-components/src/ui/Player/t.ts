import type React from 'react';
import type { t } from '../common.ts';

/**
 * Library: Players
 */
export type PlayerLib = {
  Video: {
    signals: t.PlayerSignalsFactory;
    Element: React.FC<t.VideoElementProps>;
    Vidstack: React.FC<t.VidstackPlayerProps>;
  };
  Timestamp: {
    Thumbnails: { View: React.FC<t.ThumbnailsProps> };
    Elapsed: { View: React.FC<t.ElapsedTimeProps> };
  };
};
