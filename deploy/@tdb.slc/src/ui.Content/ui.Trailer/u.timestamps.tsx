import React from 'react';

import { type t, CanvasPanel, CanvasSlug } from './common.ts';

const Slug = CanvasSlug;
const panels = CanvasPanel.list;

export const timestamps: t.ContentTimestamps = {
  '00:00:00.000': (p) => <Slug {...p} logo={'SLC'} />,
  '00:00:00.001': (p) => <Slug {...p} text={'social ventures'} />,
  '00:00:03.560': (p) => <Slug {...p} text={'good ideas'} />,
  '00:00:07.000': (p) => <Slug {...p} text={'wrong priorities'} />,

  '00:00:11.870': (p) => <Slug {...p} selected={'purpose'} text={'purpose'} />,
  '00:00:19.600': (p) => <Slug {...p} selected={panels} text={'decompose'} />,
  '00:00:23.500': (p) => <Slug {...p} selected={panels.toReversed()} text={'recompose'} />,
  '00:00:29.540': (p) => <Slug {...p} selected={'purpose'} logo={'SLC'} />,
  '00:00:34.000': (p) => <Slug {...p} selected={'purpose'} text={'coherence'} />,
  '00:00:37.590': (p) => <Slug {...p} selected={'purpose'} logo={'SLC'} />,
  '00:00:47.350': (p) => <Slug {...p} selected={'purpose'} text={'shared clarity'} />,
  '00:00:55.620': (p) => <Slug {...p} selected={'purpose'} logo={'CC'} />,
  '00:00:59.000': (p) => <Slug {...p} selected={'purpose'} logo={'SLC'} />,
};
