import type React from 'react';
import type { t } from '../common.ts';

/**
 * Library: Players
 */
export type PlayerLib = {
  Concept: {
    View: React.FC<t.ConceptPlayerProps>;
  };
  Video: {
    View: React.FC<t.VideoPlayerProps>;
    signals(): t.VideoPlayerSignals;
  };
  Timestamp: {
    Thumbnails: { View: React.FC<t.ThumbnailsProps> };
  };
};
