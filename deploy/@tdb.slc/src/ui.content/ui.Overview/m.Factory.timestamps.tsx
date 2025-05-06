import React from 'react';
import { type t, CanvasSlug, Image, IMAGE } from './common.ts';

const Slug = CanvasSlug;

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
    pulldown: () => <Image.View src={IMAGE.failure} />,
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
    pulldown: () => <Image.View src={IMAGE.build} padding={'5%'} />,
  },
  '00:01:23.000': { column: () => <Slug logo={'SLC'} /> },
  '00:01:25.250': {
    column: () => <Slug logo={'SLC'} />,
    pulldown: () => <Image.View src={IMAGE.definingPurpose} />,
  },
  '00:01:37.900': {
    column: () => <Slug logo={'SLC'} />,
    pulldown: () => <Image.View src={IMAGE.modelParts} padding={'10%'} />,
  },
  '00:01:49.000': { column: () => <Slug logo={'SLC'} /> },
  '00:01:50.810': {
    column: () => <Slug logo={'SLC'} />,
    pulldown: () => <Image.View src={IMAGE.customerModel} />,
  },
  '00:02:11.000': { column: () => <Slug text={'simple'} /> },
  '00:02:16.000': { column: () => <Slug text={'complex'} /> },
  '00:02:23.360': { column: () => <Slug text={'complex\nprotocol'} /> },
  '00:02:33.460': { column: () => <Slug /> },
  '00:02:37.000': {
    column: () => <Slug logo={'SLC'} />,
    pulldown: () => <Image.View src={IMAGE.impactModel} />,
  },
  '00:02:43.660': { column: () => <Slug text={'proveable\nimpact'} /> },
  '00:02:48.000': {
    column: () => <Slug logo={'SLC'} />,
    pulldown: () => <Image.View src={IMAGE.economicModel} />,
  },
  '00:03:04.660': { column: () => <Slug logo={'SLC'} /> },
  '00:03:10.000': {
    column: () => <Slug logo={'SLC'} />,
    pulldown: () => <Image.View src={IMAGE.refine} />,
  },
  '00:03:15.730': { column: () => <Slug text={'genuinely\nhigh\npotential'} /> },
  '00:03:19.250': {
    column: () => <Slug logo={'SLC'} />,
    pulldown: () => <Image.View src={IMAGE.strategy} />,
  },
  '00:03:33.000': { column: () => <Slug logo={'CC'} /> },
};
