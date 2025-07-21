import type React from 'react';
import type { t } from '../common.ts';

/**
 * Library: Players
 */
export type PlayerLib = {
  Video: {
    View: React.FC<t.VideoElement2Props>;
    Element__OLD: React.FC<t.VideoElementProps__OLD>;

    signals: t.PlayerSignalsFactory;
    useSignals: t.UsePlayerSignals;
  };
  Timestamp: {
    Thumbnails: { View: React.FC<t.ThumbnailsProps> };
    Elapsed: { View: React.FC<t.ElapsedTimeProps> };
  };
};
