import type React from 'react';
import type { t } from '../common.ts';

/**
 * Library: Players
 */
export type PlayerLib = {
  Video: {
    /**
     * @deprecated Obsolete—will be removed in a future release.
     *   Use `Player.Video.Element2` instead.
     */
    Vidstack: React.FC<t.VidstackPlayerProps>; // ← 🐷 Obsolete.

    Element: React.FC<t.VideoElementProps>;
    Element2: React.FC<t.VideoElement2Props>;

    signals: t.PlayerSignalsFactory;
    useSignals: t.UsePlayerSignals;
  };
  Timestamp: {
    Thumbnails: { View: React.FC<t.ThumbnailsProps> };
    Elapsed: { View: React.FC<t.ElapsedTimeProps> };
  };
};
