import React from 'react';
import { type t, CanvasPanel, CanvasSlug } from './common.ts';

const Slug = CanvasSlug;
const panels = CanvasPanel.list;

/**
 * Trailer:
 */
export const timestamps: t.ContentTimestamps = {
  '00:00:00.000': { column: () => <Slug logo={'SLC'} /> },
  '00:00:00.001': { column: () => <Slug text={'social ventures'} /> },
  '00:00:03.560': { column: () => <Slug text={'good ideas'} /> },
  '00:00:07.000': { column: () => <Slug text={'wrong priorities'} /> },

  '00:00:11.870': { column: () => <Slug selected={'purpose'} text={'purpose'} /> },
  '00:00:19.600': { column: () => <Slug selected={panels} text={'decompose'} /> },
  '00:00:23.500': { column: () => <Slug selected={panels.toReversed()} text={'recompose'} /> },
  '00:00:29.540': { column: () => <Slug selected={'purpose'} logo={'SLC'} /> },
  '00:00:34.000': { column: () => <Slug selected={'purpose'} text={'coherence'} /> },
  '00:00:37.590': { column: () => <Slug selected={'purpose'} logo={'SLC'} /> },
  '00:00:47.350': { column: () => <Slug selected={'purpose'} text={'shared clarity'} /> },
  '00:00:55.620': { column: () => <Slug selected={'purpose'} logo={'CC'} /> },
};
