import type React from 'react';
import type { t } from '../common.ts';

/**
 * Library: Players
 */
export type PlayerLib = {
  Video: {
    Element: React.FC<t.VideoElementProps>;
    signals: t.PlayerSignalsFactory;
    useSignals: t.UsePlayerSignals;
  };
  Timestamp: {
    Thumbnails: { View: React.FC<t.ThumbnailsProps> };
    Elapsed: { View: React.FC<t.ElapsedTimeProps> };
  };
};
