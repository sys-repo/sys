import React from 'react';
import { type t, CanvasSlug, Image, IMAGE, Dir } from './common.ts';

const Slug = CanvasSlug;
const dir = Dir.overview;

/**
 * Overview:
 */
export const timestamps: t.ContentTimestamps = {
  '00:00:00.000': { column: () => <Slug logo={'SLC'} /> },
  '00:00:01.000': { column: () => <Slug /> },
  '00:00:02.300': { column: () => <Slug text={'slow'} /> },
  '00:00:03.210': { column: () => <Slug text={'risky'} /> },
  '00:00:04.300': { column: () => <Slug text={'mostly\nunsuccessful'} /> },
  '00:00:06.350': { column: () => <Slug /> },
  '00:00:08.000': {
    column: () => <Slug logo={'SLC'} />,
    pulldown: () => <Image.View src={dir.path('failure.png')} />,
  },
  '00:00:16.000': { column: () => <Slug /> },
  '00:00:16.850': { column: () => <Slug text={'business model'} /> },
  '00:00:18.580': { column: () => <Slug text={'economic\nfoundation'} /> },
  '00:00:23.550': {
    column: () => <Slug text={'lasting\nmeasurable\nimpact'} selected={'impact'} />,
  },
  '00:00:36.000': { column: () => <Slug /> },
  '00:00:36.250': { column: () => <Slug text={'fast fail'} /> },
  '00:00:42.000': { column: () => <Slug text={'living dead'} /> },
  '00:00:53.000': { column: () => <Slug /> },
  '00:00:58.300': { column: () => <Slug text={'shared\nsense-making'} /> },
  '00:01:04.000': { column: () => <Slug logo={'SLC'} /> },
  '00:01:09.000': {
    column: () => <Slug logo={'SLC'} />,
    pulldown: () => <Image.View src={dir.path('build-measure-learn.png')} padding={'5%'} />,
  },
  '00:01:23.000': { column: () => <Slug logo={'SLC'} /> },
  '00:01:25.250': {
    column: () => <Slug logo={'SLC'} />,
    pulldown: () => <Image.View src={dir.path('defining-purpose.png')} />,
  },
  '00:01:37.900': {
    column: () => <Slug logo={'SLC'} />,
    pulldown: () => <Image.View src={dir.path('model-parts.png')} padding={'10%'} />,
  },
  '00:01:49.000': { column: () => <Slug logo={'SLC'} /> },
  '00:01:50.810': {
    column: () => <Slug logo={'SLC'} />,
    pulldown: () => <Image.View src={dir.path('customer-model.png')} />,
  },
  '00:02:11.000': { column: () => <Slug text={'simple'} /> },
  '00:02:16.000': { column: () => <Slug text={'complex'} /> },
  '00:02:23.360': { column: () => <Slug text={'complex\nprotocol'} /> },
  '00:02:33.460': { column: () => <Slug /> },
  '00:02:37.000': {
    column: () => <Slug logo={'SLC'} />,
    pulldown: () => <Image.View src={dir.path('impact-model.png')} />,
  },
  '00:02:43.660': { column: () => <Slug text={'proveable\nimpact'} /> },
  '00:02:48.000': {
    column: () => <Slug logo={'SLC'} />,
    pulldown: () => <Image.View src={dir.path('economic-model.png')} />,
  },
  '00:03:04.660': { column: () => <Slug logo={'SLC'} /> },
  '00:03:10.000': {
    column: () => <Slug logo={'SLC'} />,
    pulldown: () => <Image.View src={dir.path('refine.png')} />,
  },
  '00:03:15.730': { column: () => <Slug text={'genuinely\nhigh\npotential'} /> },
  '00:03:19.250': {
    column: () => <Slug logo={'SLC'} />,
    pulldown: () => <Image.View src={dir.path('strategy.png')} />,
  },
  '00:03:33.000': { column: () => <Slug logo={'CC'} /> },
};
