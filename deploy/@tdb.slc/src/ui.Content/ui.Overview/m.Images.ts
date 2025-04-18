import { i } from './common.ts';

export const Images = {
  build: i(() => import('./img/build-measure-learn.png')),
  impactModel: i(() => import('./img/impact-model.png')),
  customerModel: i(() => import('./img/customer-model.png')),
  modelParts: i(() => import('./img/model-parts.png')),
  definingPurpose: i(() => import('./img/defining-purpose.png')),
  refine: i(() => import('./img/refine.png')),
  economicModel: i(() => import('./img/economic-model.png')),
  strategy: i(() => import('./img/strategy.png')),
  failure: i(() => import('./img/failure.png')),
} as const;
