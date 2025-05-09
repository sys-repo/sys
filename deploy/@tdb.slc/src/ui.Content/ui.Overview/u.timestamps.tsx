import React from 'react';
import { type t, CanvasSlug, Image, IMAGE } from './common.ts';

const Slug = CanvasSlug;

/**
 * Overview:
 */
export const timestamps: t.ContentTimestamps = {
  '00:00:00.000': (p) => <Slug {...p} logo={'SLC'} />,
  '00:00:01.000': (p) => <Slug {...p} />,
  '00:00:02.300': (p) => <Slug {...p} text={'slow'} />,
  '00:00:03.210': (p) => <Slug {...p} text={'risky'} />,
  '00:00:04.300': (p) => <Slug {...p} text={'mostly\nunsuccessful'} />,
  '00:00:06.350': (p) => <Slug {...p} />,
  '00:00:08.000': {
    column: (p) => <Slug {...p} logo={'SLC'} />,
    pulldown: (p) => <Image.View src={IMAGE.failure} />,
  },
  '00:00:16.000': (p) => <Slug {...p} />,
  '00:00:16.850': (p) => <Slug {...p} text={'business model'} />,
  '00:00:18.580': (p) => <Slug {...p} text={'economic\nfoundation'} />,
  '00:00:23.550': (p) => <Slug {...p} text={'lasting\nmeasurable\nimpact'} selected={'impact'} />,
  '00:00:36.000': (p) => <Slug {...p} />,
  '00:00:36.250': (p) => <Slug {...p} text={'fast fail'} />,
  '00:00:42.000': (p) => <Slug {...p} text={'living dead'} />,
  '00:00:53.000': (p) => <Slug {...p} />,
  '00:00:58.300': (p) => <Slug {...p} text={'shared\nsense-making'} />,
  '00:01:04.000': (p) => <Slug {...p} logo={'SLC'} />,
  '00:01:09.000': {
    column: (p) => <Slug {...p} logo={'SLC'} />,
    pulldown: (p) => <Image.View src={IMAGE.build} padding={'5%'} />,
  },
  '00:01:23.000': (p) => <Slug {...p} logo={'SLC'} />,
  '00:01:25.250': {
    column: (p) => <Slug {...p} logo={'SLC'} />,
    pulldown: (p) => <Image.View src={IMAGE.definingPurpose} />,
  },
  '00:01:37.900': {
    column: (p) => <Slug {...p} logo={'SLC'} />,
    pulldown: (p) => <Image.View src={IMAGE.modelParts} padding={'10%'} />,
  },
  '00:01:49.000': (p) => <Slug {...p} logo={'SLC'} />,
  '00:01:50.810': {
    column: (p) => <Slug {...p} logo={'SLC'} />,
    pulldown: (p) => <Image.View src={IMAGE.customerModel} />,
  },
  '00:02:11.000': (p) => <Slug {...p} text={'simple'} />,
  '00:02:16.000': (p) => <Slug {...p} text={'complex'} />,
  '00:02:23.360': (p) => <Slug {...p} text={'complex\nprotocol'} />,
  '00:02:33.460': (p) => <Slug {...p} />,
  '00:02:37.000': {
    column: (p) => <Slug {...p} logo={'SLC'} />,
    pulldown: (p) => <Image.View src={IMAGE.impactModel} />,
  },
  '00:02:43.660': (p) => <Slug {...p} text={'proveable\nimpact'} />,
  '00:02:48.000': {
    column: (p) => <Slug {...p} logo={'SLC'} />,
    pulldown: (p) => <Image.View src={IMAGE.economicModel} />,
  },
  '00:03:04.660': (p) => <Slug {...p} logo={'SLC'} />,
  '00:03:10.000': {
    column: (p) => <Slug {...p} logo={'SLC'} />,
    pulldown: (p) => <Image.View src={IMAGE.refine} />,
  },
  '00:03:15.730': (p) => <Slug {...p} text={'genuinely\nhigh\npotential'} />,
  '00:03:19.250': {
    column: (p) => <Slug {...p} logo={'SLC'} />,
    pulldown: (p) => <Image.View src={IMAGE.strategy} />,
  },
  '00:03:33.000': (p) => <Slug {...p} logo={'CC'} />,
};
