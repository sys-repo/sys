import type React from 'react';
import type { t } from '../common.ts';

/**
 * Library: Players
 */
export type PlayerLib = {
  Concept: React.FC<t.ConceptPlayerProps>;
  Video: React.FC<t.VideoPlayerProps>;
  Timestamp: {
    Thumbnails: React.FC<t.ThumbnailsProps>;
  };
};
