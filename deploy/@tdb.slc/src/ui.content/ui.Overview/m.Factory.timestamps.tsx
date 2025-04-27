import React from 'react';
import { type t, CanvasSlug, Image, IMAGE } from './common.ts';

const Slug = CanvasSlug;

/**
 * Overview:
 */
export const timestamps: t.ContentTimestamps = {
  '00:00:00.000': () => <Slug logo={'SLC'} />,
  '00:00:01.000': () => <Slug />,
  '00:00:02.300': () => <Slug text={'slow'} />,
  '00:00:03.210': () => <Slug text={'risky'} />,
  '00:00:04.300': () => <Slug text={'mostly\nunsuccessful'} />,
  '00:00:06.350': () => <Slug />,
  '00:00:08.000': {
    column: () => <Slug logo={'SLC'} />,
    pulldown: () => <Image.View src={IMAGE.failure} />,
  },
  '00:00:16.000': () => <Slug />,
  '00:00:16.850': () => <Slug text={'business model'} />,
  '00:00:18.580': () => <Slug text={'economic\nfoundation'} />,
  '00:00:23.550': () => <Slug text={'lasting\nmeasurable\nimpact'} selected={'impact'} />,
  '00:00:36.000': () => <Slug />,
  '00:00:36.250': () => <Slug text={'fast fail'} />,
  '00:00:42.000': () => <Slug text={'living dead'} />,
  '00:00:53.000': () => <Slug />,
  '00:00:58.300': () => <Slug text={'shared\nsense-making'} />,
  '00:01:04.000': () => <Slug logo={'SLC'} />,
  '00:01:09.000': {
    column: () => <Slug logo={'SLC'} />,
    pulldown: () => <Image.View src={IMAGE.build} padding={'5%'} />,
  },
  '00:01:23.000': () => <Slug logo={'SLC'} />,
  '00:01:25.250': {
    column: () => <Slug logo={'SLC'} />,
    pulldown: () => <Image.View src={IMAGE.definingPurpose} />,
  },
  '00:01:37.900': {
    column: () => <Slug logo={'SLC'} />,
    pulldown: () => <Image.View src={IMAGE.modelParts} padding={'10%'} />,
  },
  '00:01:49.000': () => <Slug logo={'SLC'} />,
  '00:01:50.810': {
    column: () => <Slug logo={'SLC'} />,
    pulldown: () => <Image.View src={IMAGE.customerModel} />,
  },
  '00:02:11.000': () => <Slug text={'simple'} />,
  '00:02:16.000': () => <Slug text={'complex'} />,
  '00:02:23.360': () => <Slug text={'complex\nprotocol'} />,
  '00:02:33.460': () => <Slug />,
  '00:02:37.000': {
    column: () => <Slug logo={'SLC'} />,
    pulldown: () => <Image.View src={IMAGE.impactModel} />,
  },
  '00:02:43.660': () => <Slug text={'proveable\nimpact'} />,
  '00:02:48.000': {
    column: () => <Slug logo={'SLC'} />,
    pulldown: () => <Image.View src={IMAGE.economicModel} />,
  },
  '00:03:04.660': () => <Slug logo={'SLC'} />,
  '00:03:10.000': {
    column: () => <Slug logo={'SLC'} />,
    pulldown: () => <Image.View src={IMAGE.refine} />,
  },
  '00:03:15.730': () => <Slug text={'genuinely\nhigh\npotential'} />,
  '00:03:19.250': {
    column: () => <Slug logo={'SLC'} />,
    pulldown: () => <Image.View src={IMAGE.strategy} />,
  },
  '00:03:33.000': () => <Slug logo={'CC'} />,
};
